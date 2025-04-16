# 🧑‍🤝‍🧑 Assistants

Lets create a prompt with a complex directive
that we can split into sub prompts.

We are going to make a developer assistant, someone who
specializes in Typescript, can search internal documentation,
and can read/write files in the project source code.

```bash
src
├── prompts
│   ├── project.ts
│   ├── documentation.ts
│   └── typescript.ts
└── developer.ts
```
