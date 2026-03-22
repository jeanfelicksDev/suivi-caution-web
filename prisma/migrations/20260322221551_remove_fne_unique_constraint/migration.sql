-- CreateTable
CREATE TABLE "clients" (
    "id_client" SERIAL NOT NULL,
    "num_fne" TEXT NOT NULL,
    "nom_client" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id_client")
);

-- CreateTable
CREATE TABLE "dossiers_caution" (
    "id" SERIAL NOT NULL,
    "type_rembt" TEXT DEFAULT 'CAUTION',
    "nature_rembt" TEXT,
    "num_facture_caution" TEXT,
    "montant_caution" DOUBLE PRECISION,
    "date_facture" TEXT,
    "num_bl" TEXT,
    "armateur" TEXT,
    "date_reception" TEXT,
    "transitaire_actif" INTEGER DEFAULT 0,
    "transitaire_nom" TEXT,
    "client_actif" INTEGER DEFAULT 0,
    "client_nom" TEXT,
    "mandataire_nom" TEXT,
    "mandataire_piece_id" TEXT,
    "date_transmission_ligne" TEXT,
    "date_retour_ligne" TEXT,
    "date_mise_litige" TEXT,
    "date_fin_litige" TEXT,
    "transmis_sce_detention" TEXT,
    "commentaire_sce_detention" TEXT,
    "date_suspendu" TEXT,
    "date_fin_suspension" TEXT,
    "commentaire_trop_percu" TEXT,
    "date_trans_rec" TEXT,
    "date_ret_rec" TEXT,
    "observ_rec" TEXT,
    "nbre_jrs_franchise" INTEGER,
    "date_bad" TEXT,
    "date_sortie" TEXT,
    "date_retour" TEXT,
    "nbre_20" INTEGER,
    "nbre_40" INTEGER,
    "date_mise_avoir" TEXT,
    "date_fin_avoir" TEXT,
    "num_avoir" TEXT,
    "commentaire_validation" TEXT,
    "date_piece_caisse" TEXT,
    "date_1er_signature" TEXT,
    "date_retour_1er_signature" TEXT,
    "date_2e_signature" TEXT,
    "date_retour_2e_signature" TEXT,
    "date_transmission_compta" TEXT,
    "date_retour_compta" TEXT,
    "date_cheque" TEXT,
    "num_cheque" TEXT,
    "montant_final" DOUBLE PRECISION,
    "date_cloture" TEXT,
    "propose_par" TEXT,
    "banque" TEXT,
    "cloture_sans_cheque" BOOLEAN,
    "dateClotureSansCheque" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossiers_caution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheques_emis" (
    "id" SERIAL NOT NULL,
    "date_liste_recu" TEXT,
    "num_facture_caution" TEXT,
    "num_cheque" TEXT,
    "montant" DOUBLE PRECISION,
    "banque" TEXT,
    "date_cheque" TEXT,
    "date_rex" TEXT,
    "beneficiaire" TEXT,
    "commentaire" TEXT,
    "imported_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cheques_emis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheque_disponible" (
    "num_dispo_cheque" INTEGER NOT NULL,
    "date_cheqq" TIMESTAMP(3),

    CONSTRAINT "cheque_disponible_pkey" PRIMARY KEY ("num_dispo_cheque")
);

-- CreateTable
CREATE TABLE "cheque_details" (
    "id" SERIAL NOT NULL,
    "num_dispo_cheque" INTEGER,
    "num_fact_caution" TEXT,
    "montant_cheque" INTEGER,
    "num_cheque" TEXT,
    "banque" TEXT,
    "date_cheque" TIMESTAMP(3),
    "date_cloture" TIMESTAMP(3),

    CONSTRAINT "cheque_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partenaires" (
    "id_partenaire" SERIAL NOT NULL,
    "nom_partenaire" TEXT NOT NULL,
    "est_client" INTEGER NOT NULL DEFAULT 0,
    "est_transitaire" INTEGER NOT NULL DEFAULT 0,
    "num_fne" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partenaires_pkey" PRIMARY KEY ("id_partenaire")
);

-- CreateTable
CREATE TABLE "transitaires" (
    "id_transitaire" SERIAL NOT NULL,
    "num_fne_transitaire" TEXT NOT NULL,
    "nom_transitaire" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transitaires_pkey" PRIMARY KEY ("id_transitaire")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "reset_token" TEXT,
    "reset_expiry" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facture_dmdt" (
    "id" SERIAL NOT NULL,
    "num_facture_caution" TEXT,
    "num_facture_dmdt" TEXT,
    "montant_facture" DOUBLE PRECISION,
    "commentaire" TEXT,
    "date_dmdt" TEXT,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facture_dmdt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "armateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "armateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_visits" (
    "id" SERIAL NOT NULL,
    "page_name" TEXT NOT NULL,
    "visit_date" TEXT NOT NULL,
    "visit_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "montant_recouvrer" (
    "id" SERIAL NOT NULL,
    "num_facture_caution" TEXT,
    "libelle" TEXT,
    "montant" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "montant_recouvrer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_clients_1" ON "clients"("num_fne");

-- CreateIndex
CREATE INDEX "dossiers_caution_num_facture_caution_idx" ON "dossiers_caution"("num_facture_caution");

-- CreateIndex
CREATE INDEX "dossiers_caution_num_avoir_idx" ON "dossiers_caution"("num_avoir");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_transitaires_1" ON "transitaires"("num_fne_transitaire");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_users_1" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sqlite_autoindex_users_2" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "armateurs_nom_key" ON "armateurs"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "page_visits_page_name_visit_date_key" ON "page_visits"("page_name", "visit_date");
