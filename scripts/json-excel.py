import json
import pandas as pd

def calculate_top_5(s):
    """Calculates Percentage: English (301) + Best 4 others."""
    try:
        marks = []
        for i in range(1, 7):
            code = str(s.get(f'SUB{i}', ''))
            # MRKn3 is the key for total marks in your JSON structure
            total = s.get(f'MRK{i}3') 
            if code and total and str(total).isdigit() and code not in ['500', '502', '503']:
                marks.append({'code': code, 'total': int(total)})
        
        # English (301) is mandatory
        eng_list = [m['total'] for m in marks if m['code'] == '301']
        eng = eng_list[0] if eng_list else 0
        
        # Others sorted descending
        others = sorted([m['total'] for m in marks if m['code'] != '301'], reverse=True)
        
        # Result calculation
        return (eng + sum(others[:4])) / 5
    except:
        return 0.0

def export_json_to_excel():
    json_file = "results_data.json"
    output_excel = "Final_Board_Results_2026.xlsx"

    print(f"Reading {json_file}...")
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return

    rows = []
    for item in data:
        # Handle the 'data' wrapper
        s = item.get('data', item)
        
        # Skip empty/error records
        if not isinstance(s, dict) or not s.get('RROLL'):
            continue

        # Extract basic info
        student_info = {
            "Roll Number": s.get('RROLL'),
            "Name": s.get('CNAME'),
            "Section": s.get('SECTION', 'Unknown'),
            "Gender": "Male" if s.get('SEX') == 'M' else "Female",
            "Result": s.get('RESULT'),
            "Percentage": calculate_top_5(s)
        }

        # Add individual subject marks for transparency
        for i in range(1, 6):
            subj_name = s.get(f'SNAME{i}', f'Subject_{i}')
            subj_mark = s.get(f'MRK{i}3', 'N/A')
            student_info[subj_name] = subj_mark

        rows.append(student_info)

    # Convert to DataFrame
    df = pd.DataFrame(rows)

    # Sort by Percentage (High to Low)
    df = df.sort_values(by="Percentage", ascending=False)

    # Save to Excel
    df.to_excel(output_excel, index=False)
    print(f"✅ SUCCESS! Created '{output_excel}' with {len(df)} students.")

if __name__ == "__main__":
    export_json_to_excel()