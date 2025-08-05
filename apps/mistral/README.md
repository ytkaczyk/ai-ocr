## mistral
### Command arguments
`uv run main.py --input <pdf_file> --source <language_code> --target <language_code>`
### Directory structure
- <file_name.pdf>.pdf
+ <file_name.pdf>
  + raw.<source_language_code>
    - <file_name>.raw.<source_language_code>.json
    - <file_name>.raw.<source_language_code>.md
    - <file_name>.raw.<source_language_code>_page_<page number>.md
  + <source_language_code>
    - <file_name>.<source_language_code>.json
    - <file_name>.<source_language_code>.md
    - <file_name>.<source_language_code>_page_<page number>.md
  + raw.<target_language_code>
    - <file_name>.raw.<target_language_code>.json
    - <file_name>.raw.<target_language_code>.md
    - <file_name>.raw.<target_language_code>_page_<page number>.md
  + <target_language_code>
    - <file_name>.<target_language_code>.json
    - <file_name>.<target_language_code>.md
    - <file_name>.<target_language_code>_page_<page number>.md