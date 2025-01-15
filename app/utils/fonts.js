import {
  Nunito_Sans,          // variable 5 axes
  Poppins,              // 18 styles
  Rubik_Doodle_Shadow,  // 1 style
  Londrina_Outline,     // 1 style
  Galindo,              // 1 style
  Bungee_Spice,         // 1 style
  Bungee                // 1 style
} from 'next/font/google';

export const nunito_sans_init = Nunito_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito_sans',
  weight: '300',
})

export const poppins_init = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['300','600'],
})

export const rubik_doodle_shadow_init = Rubik_Doodle_Shadow({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rubik_doodle_shadow',
  weight: '400',
})

export const londrina_outline_init = Londrina_Outline({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-londrina_outline',
  weight: '400',
})

export const galindo_init = Galindo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-galindo',
  weight: '400',
})

export const bungee_spice_init = Bungee_Spice({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bungee_spice',
  weight: '400',
})

export const bungee_init = Bungee({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bungee',
  weight: '400',
})

export const nunito_sans = nunito_sans_init.variable;
export const poppins = poppins_init.variable;
export const rubik_doodle_shadow = rubik_doodle_shadow_init.variable;
export const londrina_outline = londrina_outline_init.variable;
export const galindo = galindo_init.variable;
export const bungee_spice = bungee_spice_init.variable
export const bungee = bungee_init.variable
