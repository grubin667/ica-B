import Container from "./Container";

const Footer = () => {
	return (
		<footer className="mt-auto bg-stone-950 py-4 text-stone-50">
			<Container className="flex flex-row items-center justify-center">
				<p>
					Copyright &copy; {new Date().getFullYear()} Code ICA | All Rights
					Reserved
				</p>
			</Container>
		</footer>
	);
};

export default Footer;
