import pyodbc
import os
from datetime import datetime

ACCESS_PATH = r"C:\Users\HP\Desktop\WEB CAUTION\APPLI Gestion des Cautions 3.0_be.accdb"
num_facture = "FI41600990"

def find_dossier():
    try:
        print(f"Connexion à la base Access: {ACCESS_PATH}")
        conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCESS_PATH};")
        cur = conn.cursor()

        print(f"Recherche du dossier {num_facture}...")
        cur.execute("SELECT * FROM DossierCaution WHERE NumFactureCaution = ?", (num_facture,))
        row = cur.fetchone()

        if row:
            columns = [column[0] for column in cur.description]
            data = dict(zip(columns, row))
            print("\nDossier trouvé !")
            print(data)
            
            # Rechercher aussi les détentions associées
            cur.execute("SELECT * FROM FactureDmDt WHERE IDcaution = ?", (data['IdCaution'],))
            dmdt_rows = cur.fetchall()
            if dmdt_rows:
                dmdt_cols = [c[0] for c in cur.description]
                print(f"\n{len(dmdt_rows)} détentions trouvées:")
                for dr in dmdt_rows:
                    print(" ", dict(zip(dmdt_cols, dr)))
            else:
                print("\nAucune détention trouvée.")
                
            # Rechercher les chèques associés
            cur.execute("SELECT * FROM ChequeDetails WHERE NumFactCaution = ?", (num_facture,))
            cheque_rows = cur.fetchall()
            if cheque_rows:
                cheque_cols = [c[0] for c in cur.description]
                print(f"\n{len(cheque_rows)} chèques trouvés:")
                for cr in cheque_rows:
                    print(" ", dict(zip(cheque_cols, cr)))
            else:
                print("\nAucun chèque trouvé.")
                
        else:
            print(f"\nDossier {num_facture} non trouvé dans Access.")

        conn.close()
    except Exception as e:
        print(f"ERREUR: {e}")

if __name__ == "__main__":
    find_dossier()
