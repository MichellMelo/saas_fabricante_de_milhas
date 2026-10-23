import { PrismaClient, LoyaltyProgramType } from "@prisma/client";

const prisma = new PrismaClient();

const programs: Array<{ name: string; code: string; type: LoyaltyProgramType }> = [
  { name: "Livelo", code: "LIVELO", type: LoyaltyProgramType.BANK },
  { name: "Esfera", code: "ESFERA", type: LoyaltyProgramType.BANK },
  { name: "Smiles", code: "SMILES", type: LoyaltyProgramType.AIRLINE },
  { name: "LATAM Pass", code: "LATAM_PASS", type: LoyaltyProgramType.AIRLINE },
  { name: "Azul Fidelidade", code: "AZUL_FIDELIDADE", type: LoyaltyProgramType.AIRLINE },
  { name: "ALL Accor", code: "ALL_ACCOR", type: LoyaltyProgramType.HOTEL },
  { name: "Marriott Bonvoy", code: "MARRIOTT_BONVOY", type: LoyaltyProgramType.HOTEL },
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
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
