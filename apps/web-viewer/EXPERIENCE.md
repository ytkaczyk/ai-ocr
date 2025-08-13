This documents the experience of using context engineering to create this application. 
## Template creation
* Creating the template was relatively straightforward. However, since I was opinionated about the tech stack to be used, I had to spend quite some time defining it and pointing the tool to the correct documentation. The API cost with Claude Cdde for creating the template was just under $5. The process took Claude Code about 30 minutes followed by about 1 hour of iterations.

Notes:
* behavior
* performance
* quircks

* Items that are sound:
  * Overall template seems solid. The examples are helpful and should guide Claude Code well when creating a application
  * All the examples are correct from a security standpoint, using the proper Supabase APIs

* Items that needed correcting:
  * Claude Code point to next.js 14 when the latest version is 15
  * Cluade Code used some deprecated classes from MUI v3 when the latest MUI version is 7.
  * Claude Code initially built the entire site layout from scratch as well as giving an example for ToolPad Core. I had to redirect it to fully use ToolPad Core and it then deleted over 200 lines of code from the custom template
  * I ask to use the repository parttern for data access. Claude Code created repository classes but then didn't take advantage of them and performed direct data access. It fixed it after I pointed out the issue. 

## Application context engineering files creation
* Use reverse interaction to ensure the template is complete

* Claude hanged at the end of generating the PRP and added tool execution command at the end of the md file. 

* `npm run build` and `npm run dev` hang with no error message
