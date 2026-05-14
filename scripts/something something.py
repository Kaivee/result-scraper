import json
import pdfplumber

def find_missing_students():
    # 1. Load Expected Students from PDF
    expected_students = {}
    print("Reading PRACTICAL.pdf for expected roll numbers...")
    try:
        with pdfplumber.open("PRACTICAL.pdf") as pdf:
            # Tables start on Page 4 (index 3)
            for page in pdf.pages[3:]:
                table = page.extract_table()
                if table:
                    for row in table[1:]:  # Skip header
                        if row and len(row) >= 3:
                            roll = str(row[1]).strip().replace("\n", "")
                            name = str(row[2]).strip().replace("\n", " ")
                            if roll.isdigit() and len(roll) == 8:
                                expected_students[roll] = name
        print(f"Total expected students from PDF: {len(expected_students)}")
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return

    # 2. Load Scraped Students from JSON
    scraped_rolls = set()
    print("Reading results_data.json for scraped roll numbers...")
    try:
        with open('results_data.json', 'r') as f:
            results = json.load(f)
            for item in results:
                s = item.get('data', item)
                roll = str(s.get('RROLL', '')).strip()
                if roll:
                    scraped_rolls.add(roll)
        print(f"Total students successfully scraped: {len(scraped_rolls)}")
    except Exception as e:
        print(f"Error reading JSON: {e}")
        return

    # 3. Find the difference
    missing_rolls = set(expected_students.keys()) - scraped_rolls
    
    # 4. Print the exact missing students
    print("\n" + "="*30)
    print(f"⚠️ MISSING STUDENTS: {len(missing_rolls)}")
    print("="*30)
    
    if len(missing_rolls) == 0:
        print("Perfect! No students are missing.")
    else:
        for roll in sorted(missing_rolls):
            name = expected_students[roll]
            print(f"Roll: {roll} | Name: {name}")

if __name__ == "__main__":
    find_missing_students()