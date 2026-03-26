import pyodbc
import os

ACCESS_PATH = r"C:\Users\HP\Desktop\WEB CAUTION\APPLI Gestion des Cautions 3.0_be.accdb"
num = "41600990"

def search():
    conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCESS_PATH};")
    cur = conn.cursor()
    
    # Tables to check
    for t in ["DossierCaution", "FactureDmDt", "ChequeDetails"]:
        print(f"\nRecherche dans {t}...")
        try:
            # On cherche num dans n'importe quelle colonne possiblement pertinente
            cur.execute(f"SELECT * FROM [{t}]")
            cols = [d[0] for d in cur.description]
            found = False
            for r in cur.fetchall():
                if any(num in str(val).lower() for val in r if val is not None):
                    print(f"  TROUVE: {dict(zip(cols, r))}")
                    found = True
            if not found:
                print("  Non trouvé.")
        except Exception as e:
            print(f"  Erreur table {t}: {e}")
    conn.close()

if __name__ == "__main__":
    search()
