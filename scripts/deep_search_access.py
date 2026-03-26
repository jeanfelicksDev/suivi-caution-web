import pyodbc
ACCESS_PATH = r"C:\Users\HP\Desktop\WEB CAUTION\APPLI Gestion des Cautions 3.0_be.accdb"
search_term = "41600990"

def deep_search():
    conn = pyodbc.connect(f"DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={ACCESS_PATH};")
    cur = conn.cursor()
    tables = [r.table_name for r in cur.tables(tableType='TABLE')]
    for t in tables:
        try:
            cur.execute(f"SELECT * FROM [{t}]")
            cols = [d[0] for d in cur.description]
            rows = cur.fetchall()
            for r in rows:
                if any(search_term in str(val).lower() for val in r if val is not None):
                    print(f"Table: {t}")
                    print(dict(zip(cols, r)))
        except: pass
    conn.close()

if __name__ == "__main__":
    deep_search()
