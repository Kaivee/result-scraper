import json
import pdfplumber
import os
import re

def brute_force_enrich():
    pdf_file = "PRACTICAL.pdf"
    json_file = "results_data.json"

    print("--- 🚀 STARTING FULL-TEXT REGEX EXTRACTION ---")

    if not os.path.exists(pdf_file):
        print(f"❌ Error: {pdf_file} not found.")
        return

    # This regex looks for:
    # 1. An 8-digit roll number starting with 316
    # 2. Some characters (the name)
    # 3. A section like XII A, XII B, etc.
    # Note: We use [\s\S] to match across newlines if necessary
    pattern = re.compile(r'(316\d{5})[\s\S]{1,60}?(XII\s+[A-Z])')

    section_map = {}
    
    with pdfplumber.open(pdf_file) as pdf:
        full_text = ""
        for page in pdf.pages[3:]:
            # Use layout=True to preserve horizontal relationships
            page_text = page.extract_text(layout=True)
            if page_text:
                full_text += page_text + "\n"

    # Find all matches in the long string
    matches = pattern.findall(full_text)
    for roll, section in matches:
        # Clean up any stray newlines or extra spaces
        clean_roll = roll.strip()
        clean_section = section.strip()
        section_map[clean_roll] = clean_section

    print(f"✅ Extraction Complete: Found {len(section_map)} unique mappings.")

    # 2. Update JSON
    if not os.path.exists(json_file):
        print(f"❌ Error: {json_file} not found.")
        return

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    matched = 0
    for item in data:
        s = item.get('data', item)
        if not isinstance(s, dict) or s.get('error'):
            continue
            
        roll_json = str(s.get('RROLL', '')).strip()
        
        if roll_json in section_map:
            s['SECTION'] = section_map[roll_json]
            matched += 1
        else:
            s['SECTION'] = "Other/Unknown"

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

    print("-" * 30)
    print(f"📊 FINAL STATS")
    print(f"Total Unique in PDF: {len(section_map)}")
    print(f"Total Matched in JSON: {matched}")
    print("-" * 30)

if __name__ == "__main__":
    brute_force_enrich()