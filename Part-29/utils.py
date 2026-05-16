# utils.py

def clean_text(text):
    return text.strip().lower()

if __name__ == "__main__":
    print("Testing: ", clean_text("  HELLO  "))
    