// #region Init
import { PrismaClient } from '@prisma/client';
import getDefaultParamsJSON from "./getDefaultParamsJSON.js";

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
  errorFormat: 'pretty',
})
prisma.$on('warn', (e) => { console.log(e) })
prisma.$on('info', (e) => { console.log(e) })
prisma.$on('error', (e) => { console.log(e) })
// #endregion

// #region Seed
// Create seed data that conforms with all rules enforced in creation and editing code:
// Conformance:
//   Each org has a linked internal agency
//   All orgs and agencies an admin user
//   Every org/agency pair has a model
// Separately, we have a markdown table
// #endregion

async function main() {

  // #region Clean up possible preexisting data - note commented out deleteMany of result.
  // If I put it back (i.e., uncomment the deleteMany), do I want to delete the S3 records that are, I assume,
  // no longer accessible?
  await prisma.agenciesOnOrgs.deleteMany({})
  await prisma.modelsOnAgenciesOnOrgs.deleteMany({})
  await prisma.usersOnOrgs.deleteMany({})
  await prisma.usersOnAgencies.deleteMany({})
  await prisma.markdown.deleteMany({})
  await prisma.org.deleteMany({})
  await prisma.agency.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.model.deleteMany({})
  // ??? await prisma.result.deleteMany({})
  // #endregion

  // #region Markdowns
  await prisma.markdown.create({
    data: {
      shortName: 'faq',
      name: 'Frequently Asked Questions',
      order: 1,
      md:
      `
# GFM

## Autolink literals

www.example.com, https://example.com, and contact@example.com.

## Footnote

A note[^1]

[^1]: Big note.

## Strikethrough

~one~ or ~~two~~ tildes.

## Table

| a | b  |  c |  d  |
| - | :- | -: | :-: |

## Tasklist

* [ ] to do
* [x] done

## Tag filter

<plaintext>

`,
      html: ``
    }
  })
  await prisma.markdown.create({
    data: {
      shortName: 'start',
      name: 'Getting Started',
      order: 2,
      md:
      `
# Getting Started
      `,
      html: ``
    }
  })
  await prisma.markdown.create({
    data: {
      shortName: 'magic',
      name: 'Magic Links',
      order: 3,
      md:
      `
# Magic Links
      `,
      html: ``
    }
  })
  await prisma.markdown.create({
    data: {
      shortName: 'oa',
      name: 'Orgs and Agencies',
      order: 4,
      md:
      `
# Orgs &amp; Agencies
      `,
      html: ``
    }
  })
  await prisma.markdown.create({
    data: {
      shortName: 'audio',
      name: 'Audio Files',
      order: 5,
      md:
      `
# Audio Files
      `,
      html: ``
    }
  })
  await prisma.markdown.create({
    data: {
      shortName: 'scoring',
      name: 'Scoring',
      order: 6,
      md:
      `
# Scoring
      `,
      html: ``
    }
  })
  // #endregion

  // #region Orgs
  //   2 orgs: HospitalsUSA, ForProfitHospitalOrg
const HospitalsUSA = await prisma.org.create({
    data: {
      name: 'HospitalsUSA',
    }
  })
  const ForProfitHospitalOrg = await prisma.org.create({
    data: {
      name: 'ForProfitHospitalOrg',
    }
  })
  // #endregion

  // #region Agencies
  //   2 agencies: 1 internal for each org
  const HospitalsUSA_internal = await prisma.agency.create({
    data: {
      name: 'HospitalsUSA_internal',
      city: 'Warwick',
      state: 'RI',
    }
  })
  const ForProfitHospitalOrg_internal = await prisma.agency.create({
    data: {
      name: 'ForProfitHospitalOrg_internal',
      city: 'Greenville',
      state: 'TX',
    }
  })
  // #endregion

  // #region Models
  //   2 scoring models (default settings) called model1, model2; 1 for each org/agency pair
  const model1 = await prisma.model.create({
    data: {
      name: 'Test Model 1',
      description: 'This model is a placeholder',
      params: getDefaultParamsJSON("J") // build default model params obj and returns it stringified
    }
  })
  const model2 = await prisma.model.create({
    data: {
      name: 'Test Model 2',
      description: 'This model is a placeholder',
      params: getDefaultParamsJSON("J")
    }
  })
  // #endregion

  // #region Users
  //   5 users each for Jerry and Kent as follows:
  //     Role             Name     Email
  //     superadmin       Jerry_SA jerry@rubintech.com
  //     org admin        Jerry_OA gerald.rubin@gmail.com
  //     org member       Jerry_OM geraldrubin@gmail.com
  //     agency admin     Jerry_AA gerald..rubin@gmail.com
  //     agency member    Jerry_AM gerald...rubin@gmail.com
  const Jerry_SA = await prisma.user.create({
    data: {
      email: 'jerry@rubintech.com',
      phone: '(603) 233-2050',
      name: 'Jerry_SA Rubin',
      superAdmin: true,
    }
  })
  const Jerry_OA = await prisma.user.create({
    data: {
      email: 'gerald.rubin@gmail.com',
      phone: '(603) 233-2050',
      name: 'Jerry_OA Rubin',
      superAdmin: false,
    }
  })
  const Jerry_OM = await prisma.user.create({
    data: {
      email: 'geraldrubin@gmail.com',
      phone: '(603) 233-2050',
      name: 'Jerry_OM Rubin',
      superAdmin: false,
    }
  })
  const Jerry_AA = await prisma.user.create({
    data: {
      email: 'gerald.rub.in@gmail.com',
      phone: '(603) 233-2050',
      name: 'Jerry_AA Rubin',
      superAdmin: false,
    }
  })
  const Jerry_AM = await prisma.user.create({
    data: {
      email: 'ger.ald.ru.bin@gmail.com',
      phone: '(603) 233-2050',
      name: 'Jerry_AM Rubin',
      superAdmin: false,
    }
  })

  const Kent_SA = await prisma.user.create({
    data: {
      email: 'kentjmcallister@gmail.com',
      phone: '(816) 678-4879',
      name: 'Kent_SA McAllister',
      superAdmin: true,
    }
  })
  const Kent_OA = await prisma.user.create({
    data: {
      email: 'kent.j.mcallister@gmail.com',
      phone: '(816) 678-4879',
      name: 'Kent_OA McAllister',
      superAdmin: false,
    }
  })
  const Kent_OM = await prisma.user.create({
    data: {
      email: 'ke.nt.jmc.allister@gmail.com',
      phone: '(816) 678-4879',
      name: 'Kent_OM McAllister',
      superAdmin: false,
    }
  })
  const Kent_AA = await prisma.user.create({
    data: {
      email: 'ke.n.t.j.mcallister@gmail.com',
      phone: '(816) 678-4879',
      name: 'Kent_AA McAllister',
      superAdmin: false,
    }
  })
  const Kent_AM = await prisma.user.create({
    data: {
      email: 'k.en.t.j.mca.llister@gmail.com',
      phone: '(816) 678-4879',
      name: 'Kent_AM McAllister',
      superAdmin: false,
    }
  })
  // #endregion

  // #region O/A junctions
  // link agencies to their orgs
  await prisma.agenciesOnOrgs.create({
    data: {
      orgId: HospitalsUSA.id,
      agencyId: HospitalsUSA_internal.id,
      isInternalAgency: true,
      activeModelId: model1.id
    }
  })
  await prisma.agenciesOnOrgs.create({
    data: {
      orgId: ForProfitHospitalOrg.id,
      agencyId: ForProfitHospitalOrg_internal.id,
      isInternalAgency: true,
      activeModelId: model2.id
    }
  })
  // #endregion

  // #region modelsOnAgenciesOnOrgs
  // Now that models and agenciesOnOrgs have data, add models to the pairs.
  // Models cannot be shared by org/agency pairs. Since we are creating 2 org/agency
  // pairs, we need 2 distinctly identified models.
  await prisma.modelsOnAgenciesOnOrgs.create({
    data: {
      modelId: model1.id,
      orgId: HospitalsUSA.id,
      agencyId: HospitalsUSA_internal.id,
    }
  })
  await prisma.modelsOnAgenciesOnOrgs.create({
    data: {
      modelId: model2.id,
      orgId: ForProfitHospitalOrg.id,
      agencyId: ForProfitHospitalOrg_internal.id,
    }
  })
  // #endregion

  // #region UsersOnOrgs
  // create admin for each org and agency
  // will use same user as org admin and admin of its internal agency

  // await prisma.usersOnOrgs.create({
  //   data: {
  //     orgId: HospitalsUSA.id,
  //     userId: Jerry_SA.id,
  //     isOrgAdmin: true
  //   }
  // })
  // await prisma.usersOnAgencies.create({
  //   data: {
  //     agencyId: HospitalsUSA_internal.id,
  //     userId: Jerry_SA.id,
  //     isAgencyAdmin: true
  //   }
  // })
  // await prisma.usersOnOrgs.create({
  //   data: {
  //     orgId: ForProfitHospitalOrg.id,
  //     userId: Kent_SA.id,
  //     isOrgAdmin: true
  //   }
  // })
  // await prisma.usersOnAgencies.create({
  //   data: {
  //     agencyId: ForProfitHospitalOrg_internal.id,
  //     userId: Kent_SA.id,
  //     isAgencyAdmin: true
  //   }
  // })
  
  await prisma.usersOnOrgs.create({
    data: {
      orgId: HospitalsUSA.id,
      userId: Jerry_OA.id,
      isOrgAdmin: true
    }
  })
  await prisma.usersOnAgencies.create({
    data: {
      agencyId: HospitalsUSA_internal.id,
      userId: Jerry_OA.id,
      isAgencyAdmin: false
    }
  })
  await prisma.usersOnOrgs.create({
    data: {
      orgId: ForProfitHospitalOrg.id,
      userId: Kent_OA.id,
      isOrgAdmin: true
    }
  })
  await prisma.usersOnAgencies.create({
    data: {
      agencyId: ForProfitHospitalOrg_internal.id,
      userId: Kent_OA.id,
      isAgencyAdmin: false
    }
  })
  
  await prisma.usersOnOrgs.create({
    data: {
      orgId: HospitalsUSA.id,
      userId: Jerry_OM.id,
      isOrgAdmin: false
    }
  })
  await prisma.usersOnAgencies.create({
    data: {
      agencyId: HospitalsUSA_internal.id,
      userId: Jerry_OM.id,
      isAgencyAdmin: false
    }
  })
  await prisma.usersOnOrgs.create({
    data: {
      orgId: ForProfitHospitalOrg.id,
      userId: Kent_OM.id,
      isOrgAdmin: false
    }
  })
  await prisma.usersOnAgencies.create({
    data: {
      agencyId: ForProfitHospitalOrg_internal.id,
      userId: Kent_OM.id,
      isAgencyAdmin: false
    }
  })
  
  await prisma.usersOnOrgs.create({
    data: {
      orgId: HospitalsUSA.id,
      userId: Jerry_AA.id,
      isOrgAdmin: false
    }
  })
  await prisma.usersOnAgencies.create({
    data: {
      agencyId: HospitalsUSA_internal.id,
      userId: Jerry_AA.id,
      isAgencyAdmin: true
    }
  })
  await prisma.usersOnOrgs.create({
    data: {
      orgId: ForProfitHospitalOrg.id,
      userId: Kent_AA.id,
      isOrgAdmin: false
    }
  })
  await prisma.usersOnAgencies.create({
    data: {
      agencyId: ForProfitHospitalOrg_internal.id,
      userId: Kent_AA.id,
      isAgencyAdmin: true
    }
  })
  
  await prisma.usersOnOrgs.create({
    data: {
      orgId: HospitalsUSA.id,
      userId: Jerry_AM.id,
      isOrgAdmin: false
    }
  })
  await prisma.usersOnAgencies.create({
    data: {
      agencyId: HospitalsUSA_internal.id,
      userId: Jerry_AM.id,
      isAgencyAdmin: false
    }
  })
  await prisma.usersOnOrgs.create({
    data: {
      orgId: ForProfitHospitalOrg.id,
      userId: Kent_AM.id,
      isOrgAdmin: false
    }
  })
  await prisma.usersOnAgencies.create({
    data: {
      agencyId: ForProfitHospitalOrg_internal.id,
      userId: Kent_AM.id,
      isAgencyAdmin: false
    }
  })
  
  // #endregion



  // // 2 orgs
  // const HospitalsUSA2 = await prisma.org.create({
  //   data: {
  //     name: 'HospitalsUSA2',
  //   }
  // })
  // const ForProfitHospitalOrg2 = await prisma.org.create({
  //   data: {
  //     name: 'ForProfitHospitalOrg2',
  //   }
  // })

  // // and the orgs' internal agencies
  // const HospitalsUSA2_internal = await prisma.agency.create({
  //   data: {
  //     name: 'HospitalsUSA2_internal',
  //     city: 'Warwick',
  //     state: 'RI',
  //   }
  // })
  // const ForProfitHospitalOrg2_internal = await prisma.agency.create({
  //   data: {
  //     name: 'ForProfitHospitalOrg2_internal',
  //     city: 'Greenwich',
  //     state: 'CT',
  //   }
  // })

  // // 2 models, one for each org/agency pair
  // const model3 = await prisma.model.create({
  //   data: {
  //     name: 'Test Model 3',
  //     description: 'This model is a placeholder',
  //     params: getDefaultParamsJSON("J") // build default model params obj and returns it stringified
  //   }
  // })
  // const model4 = await prisma.model.create({
  //   data: {
  //     name: 'Test Model 4',
  //     description: 'This model is a placeholder',
  //     params: getDefaultParamsJSON("J")
  //   }
  // })

  // // link agencies to their orgs
  // await prisma.agenciesOnOrgs.create({
  //   data: {
  //     orgId: HospitalsUSA2.id,
  //     agencyId: HospitalsUSA2_internal.id,
  //     isInternalAgency: true,
  //     activeModelId: model3.id
  //   }
  // })
  // await prisma.agenciesOnOrgs.create({
  //   data: {
  //     orgId: ForProfitHospitalOrg2.id,
  //     agencyId: ForProfitHospitalOrg2_internal.id,
  //     isInternalAgency: true,
  //     activeModelId: model4.id
  //   }
  // })

  // // Now that models and agenciesOnOrgs have data, add models to the pairs.
  // await prisma.modelsOnAgenciesOnOrgs.create({
  //   data: {
  //     modelId: model3.id,
  //     orgId: HospitalsUSA2.id,
  //     agencyId: HospitalsUSA2_internal.id,
  //   }
  // })
  // await prisma.modelsOnAgenciesOnOrgs.create({
  //   data: {
  //     modelId: model4.id,
  //     orgId: ForProfitHospitalOrg2.id,
  //     agencyId: ForProfitHospitalOrg2_internal.id,
  //   }
  // })

  // // jerry2 will be linked to HospitalsUSA org + agency.
  // await prisma.usersOnOrgs.create({
  //   data: {
  //     orgId: HospitalsUSA2.id,
  //     userId: jerry2.id,
  //     isOrgAdmin: true
  //   }
  // })
  // await prisma.usersOnAgencies.create({
  //   data: {
  //     agencyId: HospitalsUSA2_internal.id,
  //     userId: jerry2.id,
  //     isAgencyAdmin: true
  //   }
  // })

  // // kent2 will be linked to ForProfitHospitalOrg2 org + agency.
  // await prisma.usersOnOrgs.create({
  //   data: {
  //     orgId: ForProfitHospitalOrg2.id,
  //     userId: kent2.id,
  //     isOrgAdmin: true
  //   }
  // })
  // await prisma.usersOnAgencies.create({
  //   data: {
  //     agencyId: ForProfitHospitalOrg2_internal.id,
  //     userId: kent2.id,
  //     isAgencyAdmin: true
  //   }
  // })

}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
