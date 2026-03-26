import pyodbc
ACCESS_PATH = r"C:\Users\HP\Desktop\WEB CAUTION\APPLI Gestion des Cautions 3.0_be.accdb"
num = "41600990"

def get_full():
    conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCESS_PATH};")
    cur = conn.cursor()
    cur.execute("SELECT * FROM DossierCaution WHERE NumFactureCaution LIKE ?", (f'%{num}%',))
    row = cur.fetchone()
    if row:
        data = dict(zip([d[0] for d in cur.description], row))
        print("Dossier DossierCaution:", data)
        
        # Check FactureDmDt
        cur.execute("SELECT * FROM FactureDmDt WHERE IDcaution = ?", (data['IdCaution'],))
        dmdts = cur.fetchall()
        for d in dmdts:
            cols = [col[0] for col in cur.description]
            print("Détention FactureDmDt:", dict(zip(cols, d)))
            
        # Check ChequeDetails
        cur.execute("SELECT * FROM ChequeDetails WHERE NumFactCaution LIKE ?", (f'%{num}%',))
        cheques = cur.fetchall()
        for c in cheques:
            cols = [col[0] for col in cur.description]
            print("Chèque ChequeDetails:", dict(zip(cols, c)))
    else:
        print("Dossier non trouvé avec LIKE.")
    conn.close()

if __name__ == "__main__":
    get_full()
