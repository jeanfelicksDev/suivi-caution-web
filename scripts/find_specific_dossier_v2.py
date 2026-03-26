import pyodbc
import os

ACCESS_PATH = r"C:\Users\HP\Desktop\WEB CAUTION\APPLI Gestion des Cautions 3.0_be.accdb"
# On va aussi essayer le fichier local au cas où
ACCESS_PATH_LOCAL = r"c:\Users\HP\AntiGravity\suivi_caution_web\APPLI Gestion des Cautions 3.0_be.accdb"

num = "41600990"

def search_in_file(path):
    print(f"\n--- Recherche dans {path} ---")
    if not os.path.exists(path):
        print("Fichier non trouvé.")
        return
    try:
        conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={path};")
        cur = conn.cursor()
        
        # 1. Recherche dans DossierCaution
        print("Search in DossierCaution...")
        cur.execute("SELECT * FROM DossierCaution WHERE NumFactureCaution LIKE ?", (f'%{num}%',))
        rows = cur.fetchall()
        for r in rows:
            print("Trouvé dans DossierCaution:", dict(zip([d[0] for d in cur.description], r)))
            
        # 2. Recherche dans FactureDmDt
        print("Search in FactureDmDt...")
        cur.execute("SELECT * FROM FactureDmDt WHERE NumFacture LIKE ?", (f'%{num}%',))
        rows = cur.fetchall()
        for r in rows:
            print("Trouvé dans FactureDmDt:", dict(zip([d[0] for d in cur.description], r)))

        # 3. Recherche dans ChequeDetails
        print("Search in ChequeDetails...")
        cur.execute("SELECT * FROM ChequeDetails WHERE NumFactCaution LIKE ?", (f'%{num}%',))
        rows = cur.fetchall()
        for r in rows:
            print("Trouvé dans ChequeDetails:", dict(zip([d[0] for d in cur.description], r)))

        conn.close()
    except Exception as e:
        print(f"Erreur: {e}")

if __name__ == "__main__":
    search_in_file(ACCESS_PATH)
    search_in_file(ACCESS_PATH_LOCAL)
