import { cn } from "@/utils/cn";
import type { ComponentProps, FC } from "react";

const Container: FC<ComponentProps<"div">> = ({ children, ...rest }) => {
	return (
		<div className={cn("mx-auto max-w-screen-2xl px-4", rest.className)}>
			{children}
		</div>
	);
};

export default Container;
