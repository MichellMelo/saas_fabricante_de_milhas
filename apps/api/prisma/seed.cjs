require("dotenv").config({
  path: require("node:path").resolve(__dirname, "../../../.env"),
});

const { PrismaClient, LoyaltyProgramType } = require("@prisma/client");
const prisma = new PrismaClient();

const programs = [
  { name: "Livelo", code: "LIVELO", type: LoyaltyProgramType.BANK },
  { name: "Esfera", code: "ESFERA", type: LoyaltyProgramType.BANK },
  { name: "Smiles", code: "SMILES", type: LoyaltyProgramType.AIRLINE },
  { name: "LATAM Pass", code: "LATAM_PASS", type: LoyaltyProgramType.AIRLINE },
  {
    name: "Azul Fidelidade",
    code: "AZUL_FIDELIDADE",
    type: LoyaltyProgramType.AIRLINE,
  },
  { name: "ALL Accor", code: "ALL_ACCOR", type: LoyaltyProgramType.HOTEL },
  {
    name: "Marriott Bonvoy",
    code: "MARRIOTT_BONVOY",
    type: LoyaltyProgramType.HOTEL,
  },
  {
    name: "Qatar Airways Privilege Club",
    code: "QATAR_PRIVILEGE_CLUB",
    type: LoyaltyProgramType.AIRLINE,
  },
  {
    name: "British Airways Executive Club",
    code: "BRITISH_AIRWAYS_EXECUTIVE_CLUB",
    type: LoyaltyProgramType.AIRLINE,
  },
  { name: "Finnair Plus", code: "FINNAIR_PLUS", type: LoyaltyProgramType.AIRLINE },
  { name: "Iberia Club", code: "IBERIA_CLUB", type: LoyaltyProgramType.AIRLINE },
  { name: "Aeroplan", code: "AEROPLAN", type: LoyaltyProgramType.AIRLINE },
  {
    name: "TAP Miles&Go",
    code: "TAP_MILES_AND_GO",
    type: LoyaltyProgramType.AIRLINE,
  },
];

async function main() {
  for (const program of programs) {
    await prisma.loyaltyProgram.upsert({
      where: { code: program.code },
      update: { name: program.name, type: program.type, active: true },
      create: program,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
