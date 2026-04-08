// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-publications",
          title: "Publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "A collection of interesting projects.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "news-redesigned-academic-homepage-with-a-clearer-research-focus-on-rl-ml-and-nlp-in-financial-markets",
          title: 'Redesigned academic homepage with a clearer research focus on RL, ML, and NLP...',
          description: "",
          section: "News",},{id: "projects-advanced-prompts-database",
          title: 'Advanced-Prompts-Database',
          description: "One-Click to get your ChatGPT-database without Programming.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-learn-english-skill-for-agents",
          title: 'learn-english skill for agents',
          description: "A prompt-engineered framework for vocabulary memorization, sentence analysis, and collaborative corpus building.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/9_project/";
            },},{id: "projects-openresource-wiki",
          title: 'OpenResource Wiki',
          description: "An open-source knowledge base for AI tools, prompts, and agent skills — shared via Xiaohongshu and GitHub.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/openresource-wiki/";
            },},{id: "projects-trendr",
          title: 'TrendR',
          description: "Trend Research — Automated literature review + platform trend monitoring + Obsidian knowledge management.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/trendr/";
            },},{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
