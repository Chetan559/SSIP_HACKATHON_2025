from flask import Flask, render_template, request
from transformers import pipeline, AutoTokenizer, AutoModelForQuestionAnswering
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)

model_name = "tiiuae/falcon-180B"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForQuestionAnswering.from_pretrained(model_name)
qa_pipeline = pipeline("question-answering", model=model, tokenizer=tokenizer)

def fetch_website_text(url):
    try:
        if not url.startswith("http"):
            return "Invalid URL. Please enter a valid link."

        response = requests.get(url, timeout=10)
        response.raise_for_status() 

        soup = BeautifulSoup(response.text, 'html.parser')
        paragraphs = soup.find_all('p')

        text = "\n".join([para.get_text() for para in paragraphs if para.get_text()])

        tokens = tokenizer.tokenize(text)
        if len(tokens) > 512:
            text = tokenizer.convert_tokens_to_string(tokens[:512])

        return text if text else "No readable content found on the website."

    except requests.exceptions.RequestException as e:
        return f"Error fetching website: {e}"

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        url = request.form.get("url", "").strip()
        question = request.form.get("extra_field", "").strip()

        if not url:
            return render_template("index.html", answer="Please enter a valid website URL.")
        if not question:
            return render_template("index.html", answer="Please enter a question.")

        context = fetch_website_text(url)

        if "Error fetching website" in context or "Invalid URL" in context:
            answer = context  
        else:
            try:
                result = qa_pipeline(question=question, context=context)
                answer = result.get('answer', "No relevant answer found.")
            except Exception as e:
                answer = f"AI Model Error: {str(e)}"

        return render_template("index.html", answer=answer)

    return render_template("index.html", answer=None)

if __name__ == "__main__":
    app.run(debug=True)
