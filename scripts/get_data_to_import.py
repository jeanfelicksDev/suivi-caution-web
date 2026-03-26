import pyodbc
import json
from datetime import datetime

def format_val(val):
    if isinstance(val, datetime):
        return val.strftime('%Y-%m-%d')
    return val

ACCESS_PATH = r"c:\Users\HP\AntiGravity\suivi_caution_web\APPLI Gestion des Cautions 3.0_be.accdb"
id_caution = 3630

def get_full():
    conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCESS_PATH};")
    cur = conn.cursor()
    cur.execute("SELECT * FROM DossierCaution WHERE IdCaution = ?", (id_caution,))
    row = cur.fetchone()
    cols = [d[0] for d in cur.description]
    data = {cols[i]: format_val(row[i]) for i in range(len(cols))}
    
    cur.execute("SELECT * FROM FactureDmDt WHERE IDcaution = ?", (id_caution,))
    dmdts = cur.fetchall()
    dmdt_list = []
    for d in dmdts:
        d_cols = [col[0] for col in cur.description]
        dmdt_list.append({d_cols[i]: format_val(d[i]) for i in range(len(d_cols))})
        
    print(json.dumps({"dossier": data, "dmdts": dmdt_list}, indent=2))
    conn.close()

if __name__ == "__main__":
    get_full()
