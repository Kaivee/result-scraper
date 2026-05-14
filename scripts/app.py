import streamlit as st
import pandas as pd
import json
import plotly.express as px
import plotly.graph_objects as go

# --- PAGE CONFIGURATION ---
st.set_page_config(page_title="School Analytics 2026", page_icon="📈", layout="wide")

# Subtle styling to improve metrics and tables
st.markdown("""
    <style>
    .stApp { background-color: #0f172a; color: #f8fafc; }
    div[data-testid="metric-container"] {
        background-color: #1e293b; padding: 15px; border-radius: 10px; border: 1px solid #334155;
    }
    h1, h2, h3 { color: #38bdf8; }
    </style>
    """, unsafe_allow_html=True)

# --- DATA LOGIC ---
def extract_marks(s):
    """Extracts subjects and marks, ignoring internal grades (500, 502, 503)"""
    marks = []
    for i in range(1, 7):
        code = s.get(f'SUB{i}')
        name = s.get(f'SNAME{i}')
        total = s.get(f'MRK{i}3') # Total marks key
        
        if code and total and str(total).isdigit() and code not in ['500', '502', '503']:
            marks.append({'code': str(code), 'name': name, 'total': int(total)})
    return marks

def calculate_percentage(marks, mode):
    if not marks: return 0.0
    
    if mode == "Top 5 (English + Best 4)":
        try:
            eng = next(m['total'] for m in marks if m['code'] == '301')
            others = sorted([m['total'] for m in marks if m['code'] != '301'], reverse=True)
            return (eng + sum(others[:4])) / 5
        except StopIteration:
            return sum(sorted([m['total'] for m in marks], reverse=True)[:5]) / 5
            
    elif mode == "First 5 Subjects":
        return sum([m['total'] for m in marks[:5]]) / 5
        
    else: # All Academic Subjects
        return sum(m['total'] for m in marks) / len(marks)

@st.cache_data
def load_data():
    try:
        with open('results_data.json', 'r') as f:
            raw = json.load(f)
            
        processed = []
        for item in raw:
            if not item: continue
            s = item.get('data', item)
            if not isinstance(s, dict) or 'RROLL' not in s or s.get('error'): continue
                
            student_marks = extract_marks(s)
            processed.append({
                "Name": s.get('CNAME', 'Unknown'),
                "Roll": str(s.get('RROLL')),
                "Section": s.get('SECTION', 'Unknown'),
                "Gender": "Male" if s.get('SEX') == 'M' else "Female",
                "Marks_Data": student_marks,
                "Result": s.get('RESULT', 'N/A')
            })
        return pd.DataFrame(processed)
    except Exception:
        return pd.DataFrame()

# --- APP EXECUTION ---
df_base = load_data()

if df_base.empty:
    st.error("⚠️ Missing or corrupted `results_data.json`.")
else:
    # --- SIDEBAR CONTROLS ---
    with st.sidebar:
        st.header("⚙️ Control Panel")
        
        # Calculation Mode
        calc_mode = st.radio(
            "Calculation Mode:", 
            ["Top 5 (English + Best 4)", "First 5 Subjects", "All Subjects"]
        )
        
        st.divider()
        
        # Dropdown Filters
        st.subheader("Filters")
        section_options = ["All Sections"] + sorted(df_base['Section'].unique().tolist())
        selected_section = st.selectbox("Select Class/Section", section_options)
        
        sort_by = st.selectbox("Sort Data By", ["Highest %", "Lowest % (Bottom)", "Name (A-Z)"])

    # --- APPLY FILTERS ---
    if selected_section == "All Sections":
        df = df_base.copy()
        prefix = "Batch"
        topper_label = "School"
    else:
        df = df_base[df_base['Section'] == selected_section].copy()
        prefix = selected_section
        topper_label = selected_section

    # Calculate Percentages dynamically
    df['Percentage'] = df['Marks_Data'].apply(lambda m: calculate_percentage(m, calc_mode))
    
    # Sort Data
    if sort_by == "Highest %": df = df.sort_values("Percentage", ascending=False)
    elif sort_by == "Lowest % (Bottom)": df = df.sort_values("Percentage", ascending=True)
    else: df = df.sort_values("Name", ascending=True)
    
    df = df.reset_index(drop=True)
    df.index += 1 # Make index 1-based for display

    # --- MAIN DASHBOARD UI ---
    st.title("🏆 Class XII Result Analytics")
    st.markdown(f"**Current Mode:** `{calc_mode}` | **Filter:** `{selected_section}`")

    # DYNAMIC METRICS
    m1, m2, m3, m4 = st.columns(4)
    m1.metric(f"{prefix} Average", f"{df['Percentage'].mean():.2f}%")
    m2.metric(f"{topper_label} Topper", f"{df['Percentage'].max():.2f}%")
    m3.metric("Median Score", f"{df['Percentage'].median():.2f}%")
    m4.metric("Total Students", len(df))

    st.divider()

    # --- TABS LAYOUT ---
    tab1, tab2 = st.tabs(["📊 Class Overview", "🎓 Individual Report Card"])

    with tab1:
        col1, col2 = st.columns([1.2, 1])
        
        with col1:
            st.subheader(f"Student Rankings")
            display_df = df[["Name", "Roll", "Section", "Percentage", "Result"]].copy()
            display_df['Percentage'] = display_df['Percentage'].apply(lambda x: f"{x:.2f}%")
            st.dataframe(display_df, use_container_width=True, height=450)
            
        with col2:
            st.subheader("Score Distribution")
            fig_hist = px.histogram(df, x="Percentage", nbins=15, template="plotly_dark", color_discrete_sequence=['#3b82f6'])
            fig_hist.update_layout(margin=dict(l=20, r=20, t=20, b=20), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
            st.plotly_chart(fig_hist, use_container_width=True)
            
            if selected_section == "All Sections":
                fig_box = px.box(df, x="Section", y="Percentage", template="plotly_dark", color="Section", title="Section Comparison")
                fig_box.update_layout(margin=dict(l=20, r=20, t=40, b=20), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', showlegend=False)
                st.plotly_chart(fig_box, use_container_width=True)

    with tab2:
        st.subheader("🔍 Search Student Profile")
        
        # Combine name and roll for the dropdown
        search_list = df['Name'] + " (" + df['Roll'] + ")"
        selected_student = st.selectbox("Type to search for a student:", search_list)
        
        if selected_student:
            roll_num = selected_student.split("(")[-1].replace(")", "")
            student_data = df[df['Roll'] == roll_num].iloc[0]
            
            with st.container(border=True):
                c1, c2, c3, c4 = st.columns(4)
                c1.metric("Name", student_data['Name'])
                c2.metric("Roll Number", student_data['Roll'])
                c3.metric("Class/Section", student_data['Section'])
                c4.metric("Calculated %", f"{student_data['Percentage']:.2f}%")
            
            # Extract marks into a DataFrame for the charts
            marks_df = pd.DataFrame(student_data['Marks_Data'])
            
            col_a, col_b = st.columns(2)
            with col_a:
                st.markdown("### Subject Breakdown")
                st.dataframe(marks_df[['name', 'total']].rename(columns={'name': 'Subject', 'total': 'Marks'}), hide_index=True, use_container_width=True)
            
            with col_b:
                # Beautiful Radar Chart for individual student
                fig_radar = go.Figure()
                fig_radar.add_trace(go.Scatterpolar(
                    r=marks_df['total'].tolist() + [marks_df['total'].iloc[0]], # Close the loop
                    theta=marks_df['name'].tolist() + [marks_df['name'].iloc[0]],
                    fill='toself',
                    name=student_data['Name'],
                    line_color='#38bdf8'
                ))
                fig_radar.update_layout(
                    polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
                    showlegend=False,
                    template="plotly_dark",
                    paper_bgcolor='rgba(0,0,0,0)',
                    margin=dict(l=40, r=40, t=40, b=40)
                )
                st.plotly_chart(fig_radar, use_container_width=True)