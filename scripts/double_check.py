import pyodbc
ACCESS_PATH = r"c:\Users\HP\AntiGravity\suivi_caution_web\APPLI Gestion des Cautions 3.0_be.accdb"
num = "41600990"

def check_all():
    conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCESS_PATH};")
    cur = conn.cursor()
    cur.execute("SELECT IdCaution, NumFactureCaution FROM DossierCaution")
    for r in cur.fetchall():
        if num in str(r.NumFactureCaution).lower():
            print(f"ID: {r.IdCaution}, Num: {r.NumFactureCaution}")
    conn.close()

if __name__ == "__main__":
    check_all()
