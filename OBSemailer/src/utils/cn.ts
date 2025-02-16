import { twMerge } from "tailwind-merge";
import clsx, { ClassValue } from "clsx";

export const cn = (...classes: ClassValue[]) => {
	return twMerge(clsx(classes));
};
