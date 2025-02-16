"use client";

import { cn } from "@/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Navlinks = {
	id: string;
	name: string;
	href: string;
};

const Navigation = ({ navlinks }: { navlinks: Navlinks[] }) => {
	const pathname = usePathname();

	return (
		<nav>
			<ul className="flex flex-row items-center justify-between gap-3">
				{navlinks.map((link) => (
					<li key={link.id}>
						<Link
							href={link.href}
							className={cn(
								"text-md",
								pathname === link.href && "font-semibold",
							)}
						>
							{link.name}
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
};

export default Navigation;
