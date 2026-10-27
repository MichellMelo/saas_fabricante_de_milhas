"use client";

import { motion } from "motion/react";

export function DashboardFooter({ reduceMotion, notify }: { reduceMotion: boolean | null; notify: (message: string) => void }) {
  return (
    <motion.footer
      className="page-footer"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      <span>© 2026 Fabricante de Milhas</span>
      <span>Construído para decisões mais inteligentes.</span>
      <button
        onClick={() =>
          notify(
            "Esta versão não coleta nem armazena dados pessoais.",
          )
        }
      >
        Privacidade e segurança
      </button>
    </motion.footer>
  );
}
