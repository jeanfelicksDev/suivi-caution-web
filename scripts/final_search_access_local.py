import pyodbc
ACCESS_PATH = r"c:\Users\HP\AntiGravity\suivi_caution_web\APPLI Gestion des Cautions 3.0_be.accdb"
num = "41600990"

def search():
    conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCESS_PATH};")
    cur = conn.cursor()
    for t in ["DossierCaution", "FactureDmDt", "ChequeDetails"]:
        print(f"\nSearching in {t}...")
        cur.execute(f"SELECT * FROM [{t}]")
        cols = [d[0] for d in cur.description]
        found = False
        for r in cur.fetchall():
            if any(num in str(val).lower() for val in r if val is not None):
                print(f"  FOUND: {dict(zip(cols, r))}")
                found = True
        if not found: print("  Not found.")
    conn.close()

if __name__ == "__main__":
    search()
