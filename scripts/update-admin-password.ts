import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const email = process.argv[2] || process.env.ADMIN_EMAIL;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;

if (!email || !password) {
	console.error("Usage: tsx scripts/update-admin-password.ts <email> <password>");
	console.error("Or set ADMIN_EMAIL and ADMIN_PASSWORD env vars.");
	process.exit(1);
}

async function main() {
	const user = await prisma.user.findUnique({ where: { email: email as string } });
	if (!user) {
		throw new Error(`No user found for email: ${email}`);
	}
	const nextHash = await hash(password as string, 10);
	await prisma.user.update({
		where: { id: user.id },
		data: { password: nextHash },
	});
	console.log("Admin password updated.");
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
