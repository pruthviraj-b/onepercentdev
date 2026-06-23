from onepercentutils.text_utils import (
    clean_text,
    count_words,
    reverse_words,
    format_currency,
)


def main():
    sample = "   Hello World from OnePercent   "

    print("Original :", repr(sample))
    print("Cleaned  :", clean_text(sample))
    print("Words    :", count_words(sample))
    print("Reversed :", reverse_words(sample.strip()))
    print("Price    :", format_currency(1234567.89))


if __name__ == "__main__":
    main()
