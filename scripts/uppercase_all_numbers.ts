import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Mise à jour de tous les numéros de facture en MAJUSCULES...")

  const allDossiers = await prisma.dossiers_caution.findMany({
    select: { id: true, num_facture_caution: true }
  })

  let updatedCount = 0
  for (const d of allDossiers) {
    if (d.num_facture_caution && d.num_facture_caution !== d.num_facture_caution.toUpperCase()) {
      await prisma.dossiers_caution.update({
        where: { id: d.id },
        data: { num_facture_caution: d.num_facture_caution.toUpperCase() }
      })
      updatedCount++
      if (updatedCount % 50 === 0) console.log(`${updatedCount} dossiers...`)
    }
  }

  const allDmdts = await prisma.facture_dmdt.findMany({
    select: { id: true, num_facture_caution: true, num_facture_dmdt: true }
  })
  let dmdtUpdated = 0
  for (const d of allDmdts) {
    let changed = false
    const updateData: any = {}
    if (d.num_facture_caution && d.num_facture_caution !== d.num_facture_caution.toUpperCase()) {
      updateData.num_facture_caution = d.num_facture_caution.toUpperCase()
      changed = true
    }
    if (d.num_facture_dmdt && d.num_facture_dmdt !== d.num_facture_dmdt.toUpperCase()) {
      updateData.num_facture_dmdt = d.num_facture_dmdt.toUpperCase()
      changed = true
    }
    if (changed) {
      await prisma.facture_dmdt.update({
        where: { id: d.id },
        data: updateData
      })
      dmdtUpdated++
    }
  }

  const allCheques = await prisma.cheques_emis.findMany({
    select: { id: true, num_facture_caution: true }
  })
  let chequesUpdated = 0
  for (const c of allCheques) {
    if (c.num_facture_caution && c.num_facture_caution !== c.num_facture_caution.toUpperCase()) {
      await prisma.cheques_emis.update({
        where: { id: c.id },
        data: { num_facture_caution: c.num_facture_caution.toUpperCase() }
      })
      chequesUpdated++
    }
  }

  console.log(`Terminé !`)
  console.log(`- Dossiers : ${updatedCount}`)
  console.log(`- Détentions : ${dmdtUpdated}`)
  console.log(`- Chèques : ${chequesUpdated}`)
}

main().finally(() => prisma.$disconnect())
