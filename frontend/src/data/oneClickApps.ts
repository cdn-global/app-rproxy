
import { FaWordpress, FaDocker, FaNodeJs, FaPython, FaReact, FaUbuntu } from "react-icons/fa"
import { SiPostgresql, SiRedis, SiNginx, SiDjango, SiRubyonrails, SiMongodb, SiGhost, SiNextdotjs } from "react-icons/si"
import { IconType } from "react-icons"

export interface OneClickApp {
  id: string
  name: string
  slug: string
  description: string
  icon: IconType
  category: "CMS" | "Database" | "Development" | "Infrastructure"
  version: string
}

export const oneClickApps: OneClickApp[] = [
  {
    id: "wordpress",
    name: "WordPress",
    slug: "wordpress",
    description: "The world's most popular CMS, pre-configured with caching and SSL.",
    icon: FaWordpress,
    category: "CMS",
    version: "6.4",
  },
  {
    id: "ghost",
    name: "Ghost",
    slug: "ghost",
    description: "Professional publishing platform for newsletters and modern blogs.",
    icon: SiGhost,
    category: "CMS",
    version: "5.0",
  },
  {
    id: "docker",
    name: "Docker CE",
    slug: "docker",
    description: "Docker Community Edition with Docker Compose pre-installed.",
    icon: FaDocker,
    category: "Infrastructure",
    version: "24.0",
  },
  {
    id: "nodejs",
    name: "Node.js",
    slug: "nodejs",
    description: "JavaScript runtime built on Chrome's V8 engine.",
    icon: FaNodeJs,
    category: "Development",
    version: "20 LTS",
  },
  {
    id: "django",
    name: "Django",
    slug: "django",
    description: "The web framework for perfectionists with deadlines.",
    icon: SiDjango,
    category: "Development",
    version: "5.0",
  },
  {
    id: "rails",
    name: "Ruby on Rails",
    slug: "rails",
    description: "Web application framework that includes everything needed to create database-backed web applications.",
    icon: SiRubyonrails,
    category: "Development",
    version: "7.1",
  },
  {
    id: "nginx",
    name: "LEMP Stack",
    slug: "lemp",
    description: "Linux, Nginx, MySQL, PHP-FPM stack.",
    icon: SiNginx,
    category: "Infrastructure",
    version: "1.24",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    slug: "postgres",
    description: "The world's most advanced open source relational database.",
    icon: SiPostgresql,
    category: "Database",
    version: "16",
  },
  {
    id: "redis",
    name: "Redis",
    slug: "redis",
    description: "In-memory data structure store, used as a database, cache, and message broker.",
    icon: SiRedis,
    category: "Database",
    version: "7.2",
  },
  {
    id: "mongodb",
    name: "MongoDB",
    slug: "mongodb",
    description: "Source-available cross-platform document-oriented database program.",
    icon: SiMongodb,
    category: "Database",
    version: "7.0",
  },
  {
    id: "nextjs",
    name: "Next.js",
    slug: "nextjs",
    description: "The React Framework for the Web.",
    icon: SiNextdotjs,
    category: "Development",
    version: "14",
  },
  {
    id: "python",
    name: "Python Environment",
    slug: "python",
    description: "Pre-configured Python environment with pip, venv, and common data science libraries.",
    icon: FaPython,
    category: "Development",
    version: "3.12",
  },
]
