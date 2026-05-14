import pdfplumber
import pandas as pd
import re

def bulletproof_pdf_to_excel(pdf_path, excel_path):
    student_data = []
    # Regex to find 8-digit roll numbers starting with 316
    roll_pattern = re.compile(r'316\d{5}')
    
    print(f"🔍 Starting deep-scan of {pdf_path}...")
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages[3:], start=4):
            # Extract words with their positions to handle messy layouts
            words = page.extract_words()
            
            # Group words by their vertical position (y-coordinate) to form rows
            rows = {}
            for word in words:
                y = round(word['top'], 0) # Group by top coordinate
                if y not in rows:
                    rows[y] = []
                rows[y].append(word)
            
            # Process each "row" found visually
            for y in sorted(rows.keys()):
                line_text = " ".join([w['text'] for w in sorted(rows[y], key=lambda x: x['x0'])])
                
                # Search for the roll number in this line
                match = roll_pattern.search(line_text)
                if match:
                    roll = match.group()
                    # The name usually follows the roll number or is to the right
                    # We'll clean the line text to isolate the name
                    parts = line_text.split(roll)
                    remaining = parts[1].strip() if len(parts) > 1 else ""
                    
                    # Section is usually at the end (e.g., XII A)
                    section_match = re.search(r'XII\s+[A-Z]', remaining)
                    section = section_match.group() if section_match else "Unknown"
                    
                    # Name is what's between the Roll and the Section
                    name = remaining.replace(section, "").strip()
                    
                    if roll and name:
                        student_data.append({
                            "Roll Number": roll,
                            "Name": name,
                            "Section": section
                        })
            
            print(f"Page {i}: Found {len(student_data)} total so far...")

    df = pd.DataFrame(student_data).drop_duplicates(subset=["Roll Number"])
    df.to_excel(excel_path, index=False)
    print(f"✅ FINAL COUNT: {len(df)} unique students saved to {excel_path}.")

if __name__ == "__main__":
    bulletproof_pdf_to_excel("PRACTICAL.pdf", "Final_Student_List.xlsx")