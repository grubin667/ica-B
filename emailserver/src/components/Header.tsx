import Link from "next/link";
import Container from "./Container";
import Navigation from "./Navigation";

const navigations = [
	{ id: "1", href: "/", name: "Home" },
	{ id: "2", href: "/about", name: "Aboot" },
];

const Header = () => {
	return (
		<header className="bg-stone-950 py-4 text-stone-50">
			<Container className="flex flex-row items-center justify-between">
				<section className="flex flex-row items-center justify-between gap-16">
					<Link href="/" className="text-xl font-bold">
						Logo Jerry
					</Link>
					<Navigation navlinks={navigations} />
				</section>
				{/* <section className="flex flex-row items-center justify-end gap-4">
					<Link href="/login" className="font-semibold">
						Login
					</Link>
					<Link
						href="/sign-up"
						className="flex rounded-sm bg-stone-50 px-4 py-3 font-semibold text-stone-950"
					>
						Sign up
					</Link>
				</section> */}
			</Container>
		</header>
	);
};

export default Header;
