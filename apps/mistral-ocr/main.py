import os
import base64
import sys
import argparse
from mistralai import Mistral, OCRResponse, OCRImageObject
from mistralai.extra import response_format_from_pydantic_model
from dotenv import load_dotenv
from pydantic import BaseModel, Field
import re
from datauri import parse

load_dotenv()

def encode_pdf(pdf_path):
    """Encode the pdf to base64."""
    try:
        with open(pdf_path, "rb") as pdf_file:
            return base64.b64encode(pdf_file.read()).decode('utf-8')
    except FileNotFoundError:
        print(f"Error: The file '{pdf_path}' was not found.")
        return None
    except Exception as e:  # Added general exception handling
        print(f"Error: {e}")
        return None
    
class TransformationOutput(BaseModel):
    text: str = Field(description="The transformed text")

# BBOX Annotation response formats
class Image(BaseModel):
  image_type: str = Field(..., description="The type of the image.")
  short_description: str = Field(..., description="A description in english describing the image.")
  summary: str = Field(..., description="Summarize the image.")

def transform(client, src_language_codes: str, src_content: str, dest_language_code: str) -> TransformationOutput | None:
    messages = [
        { 
            "role": "system", 
            "content": (f"You are an expert programmer who excels at fixing markdown text so that it is valid markdown.\n"
                        "Important rules:\n"
                        "- When updating text that is in markdown, you excel at preversing the markdown formatting (headings, tables) in the output text while also making sure that it is valid.\n"
                        "  For instance:\n"
                        "  - IMPORTANT: Ensure that headers are displayed on a standalone line in the resulting text, especially if they are on a standalone line in the source text.\n"
                        "  - Ensure that headers are displayed on a separate line, especially if they are numbered and you identify a gap in the sequence because the header is at the end of an existing line.\n"
                        "  - Ensure that table headers and cells are on a single line, potentially replacing '\\n' text with '<br>' to fix markdown\n"
                        "  - Ensure that all rows in a table containing (including headers) have the same number of columns. If this is not the case, add empty columns to the row missing columns.\n"
                        "- When translating markdown that contains LaTex, you do not modify the Latex commands.\n"
                        "  For instance:\n"
                        "  - '$\\square$' is preserved as is\n"
                        "  - '$\\qquad$' is preserved as is\n"
                        "  - '$\\checkmark$' is preserved as is\n"
                        "  In particular, you should never replace Latex with a resulting '$$' as it is invalid LaTex.\n"
                        ) 
        },
        { 
            "role": "user", 
            "content": src_content 
        }
    ]

    # Make the chat completion request
    try:
        chat_response = client.chat.parse(
            model="mistral-medium-latest",
            response_format=TransformationOutput,
            temperature=0,
            messages=messages
        )

        # Print the model's response
        response: TransformationOutput =  (chat_response.choices[0].message.parsed)
        return response

    except Exception as e:
        print(f"🛑 An error occurred: {e}")
        return None
    
def translate(client, src_language_codes: str, src_content: str, dest_language_code: str) -> TransformationOutput | None:
    # Define the messages for the chat completion
    messages = [
        { 
            "role": "system", 
            "content": (f"You are an expert translator working from language code(s) {src_language_codes} to language code {dest_language_code}.\n"
                        "Important rules:\n"
                        "- Wrap each block of translated text into a block as follows:\n"
                        "    <section source_language_code=\"es\">\n"
                        "    Hello\n"
                        "    </section>\n"
                        "  where source_language_code indicate the actual source language.\n"
                        "  Always write the <section> tags on a separate line.\n"
                        "  Always write the </section> tags on a separate lines.\n"
                        "- When translating content that contains multiple languages, translate the content in all the languages even if it menas there are redundancies in the translated output text."
                        "- When translating text that is in markdown, preserve the markdown formatting in the output text while also making sure that it is valid.\n"
                        "  For instance:\n"
                        "  - Headers (line stating with # or ## or ###) are displayed on a separate line, especially if they are on a separate line in the source text.\n"
                        "  - Headers are always preceded by an empty line.\n"
                        "  - Paragraphs and empty lines in the source text are preserved in the output text.\n"
                        "  - Table headers and cells are on a single line, potentially replacing '\\n' text with '<br>' to fix markdown\n"
                        "  - All rows in a table containing (including headers) have the same number of columns. If this is not the case, add empty columns to the row missing columns.\n"
                        "- When translating markdown that contains LaTex, you do not modify the Latex commands.\n"
                        "  For instance:\n"
                        "  - '$\\square$' is preserved as is\n"
                        "  - '$\\qquad$' is preserved as is\n"
                        "  - '$\\checkmark$' is preserved as is\n"
                        "  In particular, you should never replace Latex with a resulting '$$' as it is invalid LaTex.\n"
                        ) 
        },
        { 
            "role": "user", 
            "content": src_content 
        }
    ]

    # Make the chat completion request
    try:
        chat_response = client.chat.parse(
            model="mistral-medium-latest",
            response_format=TransformationOutput,
            temperature=0,
            messages=messages
        )

        # Print the model's response
        response: TransformationOutput =  (chat_response.choices[0].message.parsed)
        return response

    except Exception as e:
        print(f"🛑 An error occurred: {e}")
        return None

def load_json_response(json_path:str) -> OCRResponse:
    """ Load the json file into an OCRResponse. """

    with open(json_path, "r", encoding="utf-8") as json_file:
        response_json = json_file.read()
        return OCRResponse.model_validate_json(response_json)
    
def save_json_response(ocr_response: OCRResponse, json_path: str):
    with open(json_path, "wt", encoding="utf-8") as json_file:
        json_file.write(ocr_response.model_dump_json(indent=2, round_trip=True))    

def save_image(dir: str, ocr_image: OCRImageObject):
    data = parse(ocr_image.image_base64)
    with open(os.path.join(dir, ocr_image.id), "wb") as f:
        f.write(data.data) 

def get_dir(path: str) -> str:
     dir, _ = os.path.split(path)
     return dir

def get_filename_no_extension(path: str) -> str:
    _, filename = os.path.split(path)
    filename_notext, _ = os.path.splitext(filename)
    return filename_notext

def replace_extension(path: str, extension: str) -> str:
    return os.path.splitext(path)[0] + (extension if extension.startswith('.') else '.' + extension)

def get_md_single_page_file_path(md_file_path: str, page_index: int) -> str:
    return f"{os.path.splitext(md_file_path)[0]}_page_{page_index+1}.md"

def save_ocr_response_to_file(ocr_response: OCRResponse, md_file_path: str):
    """Write the OCRResponse to the json file, overwritting the file if it already exists."""

    # Save all pages into a single md file
    with open(md_file_path, "wt", encoding="utf-8") as md_file:
        for page in ocr_response.pages:
            md_file.write(cleanup_markdown(page.markdown))

    # Save images
    md_file_dir = get_dir(md_file_path)
    for page in ocr_response.pages:
        for ocr_image in page.images:
            save_image(md_file_dir, ocr_image)

    # Save one page per md file
    for page_index, page in enumerate(ocr_response.pages):
        md_single_page_path = get_md_single_page_file_path(md_file_path, page_index)
        with open(md_single_page_path, "wt", encoding="utf-8") as md_single_page_file:
            md_single_page_file.write(cleanup_markdown(page.markdown))

def cleanup_markdown(md: str) -> str:
    # Replace single \n (not part of double \n) with '  \n'
    #   Negative lookbehind and lookahead to avoid replacing when there are two consecutive \n
    # Other rules as needed...
    tmp = md
    tmp = re.sub(r'(?<!\n)\n(?!\n)', '  \n', tmp)
    return tmp

def main():
    parser = argparse.ArgumentParser(description="OCR and translate PDF documents using Mistral.")
    parser.add_argument("--input", required=True, help="Path to the input PDF file.")
    parser.add_argument("--source", required=True, help="Source language code(s). Language codes are comma-separated if multiple source languages are present.")
    parser.add_argument("--target", default="en-US", help="Target language code (default: en-US).")
    parser.add_argument("--force_ocr", action="store_true", help="Force document OCR, overwritting existing raw.src OCR files if needed.")
    parser.add_argument("--force_ocr_post_process", action="store_true", help="Force transforming raw.scr to src.")
    parser.add_argument("--force_translate", action="store_true", help="Force document translation, overwritting existing raw.target translation files if needed")
    parser.add_argument("--limit_to_pages", required=False, help="Comma-separated list of pages to process (e.g., '1,3,5').")
    args = parser.parse_args()

    pdf_path = os.path.abspath(os.path.normpath(args.input))

    if(not os.path.exists(pdf_path)):
        print(f"🛑  File: {pdf_path} doesn't exist.")
        sys.exit(1)

    src_language_code = args.source
    target_language_code = args.target
    force_ocr = args.force_ocr
    force_ocr_post_process = args.force_ocr_post_process
    force_translate = args.force_translate
    limit_to_pages_str = args.limit_to_pages
    limit_to_pages = [int(p) for p in limit_to_pages_str.split(',')] if limit_to_pages_str else []

    # Create directories for the source and target files
    raw_src_language_dir : str = os.path.join(os.path.splitext(pdf_path)[0], "raw." + src_language_code)
    os.makedirs(raw_src_language_dir, exist_ok = True)
    print(f"⬆️  Raw source directory: {raw_src_language_dir}")

    src_language_dir : str = os.path.join(os.path.splitext(pdf_path)[0], src_language_code)
    os.makedirs(src_language_dir, exist_ok = True)
    print(f"➡️  Source directory: {src_language_dir}")

    raw_target_language_dir : str = os.path.join(os.path.splitext(pdf_path)[0], "raw." + target_language_code)
    os.makedirs(raw_target_language_dir, exist_ok = True)
    print(f"➡️  Raw target directory: {raw_target_language_dir}")

    target_language_dir : str = os.path.join(os.path.splitext(pdf_path)[0], target_language_code)
    os.makedirs(target_language_dir, exist_ok = True)
    print(f"⬇️  Target directory: {target_language_dir}")

    # Mistral client initialization
    api_key = os.environ["MISTRAL_API_KEY"]
    if not api_key:
        raise ValueError("MISTRAL_API_KEY not found in environment variables.")

    client : Mistral = Mistral(api_key=api_key)

    pdf_filename_notext= get_filename_no_extension(pdf_path)

    # Write the JSON string to a file with the same name as pdf_path but .json extension
    raw_src_json_filepath = os.path.join(raw_src_language_dir, pdf_filename_notext + ".raw." + src_language_code + ".json")

    # Only do the OCR if the output file doesn't exist
    if not os.path.exists(raw_src_json_filepath) or force_ocr:
        print(f"👓 OCRing file {pdf_path}")
        
        # Convert the pdf file to a base64 string
        base64_pdf = encode_pdf(pdf_path)
        
        # OCR the base64 encoded PDF file
        ocr_src_response : OCRResponse = client.ocr.process(
            model="mistral-ocr-latest",
            document={
                "type": "document_url",
                "document_url": f"data:application/pdf;base64,{base64_pdf}" 
            },
            bbox_annotation_format=response_format_from_pydantic_model(Image),
            include_image_base64=True
            # include doc and image parsing....
        )

        # Save the ocr output to a json file
        print(f"💾 Saving raw OCR results to {raw_src_json_filepath}")
        save_json_response(ocr_src_response, raw_src_json_filepath)
    else:
        print(f"♻️ Skipping OCR because file {raw_src_json_filepath} already exists.")

    # Load the json file (since OCRing might have been skipped)
    raw_src_response = load_json_response(raw_src_json_filepath)

    # Concatenate all source pages into a single markdown file
    raw_src_md_filepath = replace_extension(raw_src_json_filepath, ".md")
    save_ocr_response_to_file(raw_src_response, raw_src_md_filepath)
        
    # Transform the pages from raw.<source_language_code> to <source_language_code>
    src_json_filepath = os.path.join(src_language_dir, pdf_filename_notext + "." + src_language_code + ".json")
    src_response = load_json_response(src_json_filepath) if os.path.exists(src_json_filepath) else raw_src_response.model_copy(deep=True)
    save_json_response(src_response, src_json_filepath)
    
    src_md_filepath = replace_extension(src_json_filepath, ".md")
    print(f"🔁 Post processing {len(raw_src_response.pages)} scanned pages")
    for page_index in range(len(raw_src_response.pages)):
        # Only transform if the markdown is identical between the raw source and source for the page
        # and if the single page md file doesn't exist
        # (optimization to prevent transforming pages that have already been transformed)
        src_md_single_page_path = get_md_single_page_file_path(src_md_filepath, page_index)
        if(
            (
                (raw_src_response.pages[page_index].markdown == src_response.pages[page_index].markdown and
                not os.path.exists(src_md_single_page_path))
                or force_ocr_post_process
            )
            and (not limit_to_pages or (page_index + 1) in limit_to_pages)
        ):
            print(f"🔁 Transforming page {page_index+1}/{len(raw_src_response.pages)} (page index {page_index})")
            new_markdown = transform(client, src_language_code, raw_src_response.pages[page_index].markdown, target_language_code)
            if new_markdown is None:
                print(f"⚠️ Page {page_index+1} (page index {page_index}) was skipped")
            else:
                src_response.pages[page_index].markdown=new_markdown.text
                # Write the target json file with the updated markdown.
                # Updating the state prevent gratuitious translation on application failure.
                save_json_response(src_response, src_json_filepath)
        else:
            print(f"♻️ Skipping page {page_index+1}/{len(src_response.pages)} (page index {page_index})")
    print("")

    # Save markdown and images
    save_ocr_response_to_file(src_response, src_md_filepath)

    # Translate the pages from <source_language_code> to raw.<target_language_code>. 
    raw_target_json_filepath = os.path.join(raw_target_language_dir, pdf_filename_notext + ".raw." + target_language_code + ".json")
    raw_target_response = load_json_response(raw_target_json_filepath) if os.path.exists(raw_target_json_filepath) else src_response.model_copy(deep=True)

    target_md_filepath = replace_extension(raw_target_json_filepath, ".md") 
    print(f"🔁 Translating {len(src_response.pages)} pages")
    for page_index in range(len(src_response.pages)):
        # Only translate if the markdown is identical between the source and target for the page
        # (optimization to prevent translating pages that have already been translated)
        if(
            (src_response.pages[page_index].markdown == raw_target_response.pages[page_index].markdown or force_translate)
            and (not limit_to_pages or (page_index + 1) in limit_to_pages)
        ):
            print(f"🔁 Translating page {page_index+1}/{len(src_response.pages)} (page index {page_index})")
            translated_markdown = translate(client, src_language_code, src_response.pages[page_index].markdown, target_language_code)
            if translated_markdown is None:
                print(f"⚠️ Page {page_index+1} (page index {page_index}) was skipped")
            else:
                raw_target_response.pages[page_index].markdown=translated_markdown.text
                # Write the target json file with the updated translation.
                # Updating the state prevent gratuitious translation on application failure.
                save_json_response(raw_target_response, raw_target_json_filepath)
        else:
            print(f"♻️ Skipping page {page_index+1}/{len(src_response.pages)} (page index {page_index})")
    print("")
    
    # Save markdown and images
    save_ocr_response_to_file(raw_target_response, target_md_filepath)

if __name__ == "__main__":
    main()
