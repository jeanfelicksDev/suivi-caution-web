import pyodbc
ACCESS_PATH = r"c:\Users\HP\AntiGravity\suivi_caution_web\APPLI Gestion des Cautions 3.0_be.accdb"
search_term = "FI41600990"

def deep_search():
    try:
        conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCESS_PATH};")
        cur = conn.cursor()
        tables = [r.table_name for r in cur.tables(tableType='TABLE')]
        found = False
        for t in tables:
            try:
                cur.execute(f"SELECT * FROM [{t}]")
                cols = [d[0] for d in cur.description]
                rows = cur.fetchall()
                for r in rows:
                    if any(search_term in str(val) for val in r if val is not None):
                        print(f"\nTROUVÉ dans [{t}]:", dict(zip(cols, r)))
                        found = True
            except: pass
        if not found: print(f"'{search_term}' non trouvé dans le fichier local.")
        conn.close()
    except Exception as e: print(f"ERREUR: {e}")

if __name__ == "__main__":
    deep_search()
