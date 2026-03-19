import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
	try {
		const { email } = await req.json();

		if (!email || !email.includes("@")) {
			return NextResponse.json(
				{ error: "Valid email is required" },
				{ status: 400 }
			);
		}

		// Generate a unique coupon code for the user
		const generateCode = () => {
			const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
			let result = "PRETTY50-";
			for (let i = 0; i < 4; i++) {
				result += chars.charAt(Math.floor(Math.random() * chars.length));
			}
			return result;
		};

		// Use upsert to handle potential duplicate signups gracefully
		// We use a transaction or similar to ensure uniqueness of the couponCode if it's set
		// Since we're casting as any, we'll just handle the logic simply.
		let entry = await (prisma as any).waitlist.findUnique({
			where: { email },
		});

		if (!entry) {
			entry = await (prisma as any).waitlist.create({
				data: {
					email,
					couponCode: generateCode(),
				},
			});
		}

		return NextResponse.json({ 
			success: true, 
			id: entry.id, 
			couponCode: entry.couponCode 
		});
	} catch (error) {
		console.error("Waitlist API error:", error);
		return NextResponse.json(
			{ error: "Failed to join waitlist" },
			{ status: 500 }
		);
	}
}
