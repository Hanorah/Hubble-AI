import Link from "next/link";
import styles from "../shardeum-landing.module.css";

const social = [
  { label: "Discord", href: "https://discord.com/invite/shardeum" },
  { label: "Twitter", href: "https://twitter.com/shardeum" },
  { label: "Telegram", href: "https://telegram.me/shardeum" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCO20LJZBF-lYbc6PWVvwkMA" },
  { label: "Reddit", href: "https://www.reddit.com/r/shardeum/" },
  { label: "GitHub", href: "https://github.com/shardeum/" },
  { label: "GitLab", href: "https://gitlab.com/shardeum/server" },
];

export function ShardeumFooter() {
  return (
    <footer className={styles.section}>
      <h2>Global Footer</h2>
      <div className={styles.footerLinks}>
        {social.map((item) => (
          <Link key={item.label} href={item.href} target="_blank" rel="noreferrer">
            {item.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
