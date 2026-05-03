# # ============================================
# # PART 1: What we learned yesterday (Part 24)
# # ============================================

# # 1. Writing a function (def + parameters + return)
# def calculate_bonus(salary, percentage=10):
#     """Calculates bonus based on salary and percentage."""
#     bonus = salary * percentage / 100
#     return bonus

# # 2. Calling the function
# result = calculate_bonus(50000)
# print(result)                        # 5000.0

# result2 = calculate_bonus(50000, 20)
# print(result2)                       # 10000.0

# # 3. Scope — LEGB Rule
# company = "OnePercent"                # G — Global scope

# def show_details():
#     company = "Google"                # L — Local scope (shadows global)
#     print(company)                    # Google — Python finds L first

# show_details()
# print(company)                       # OnePercent — Global is unchanged

# # 4. Functions are first-class objects
# print(type(calculate_bonus))         # <class 'function'>
# print(calculate_bonus.__name__)      # calculate_bonus
# print(calculate_bonus.__doc__)       # Calculates bonus based on salary and percentage.

# apply = calculate_bonus              # Assign function to a variable
# print(apply(60000))                  # 6000.0


# # ============================================
# # PART 2: The problem — why we need Part 25
# # ============================================

# # Our function only handles EXACTLY 1 or 2 arguments.
# # print(calculate_bonus())           # TypeError — too few
# # print(calculate_bonus(1, 2, 3))    # TypeError — too many

# # But Python's built-in functions don't have this problem:
# print("a")                           # 1 argument — works
# print("a", "b", "c")                # 3 arguments — works

# d = {"name": "Shyam"}
# print(d.get("name"))                 # 1 argument — works
# print(d.get("age", 25))             # 2 arguments — works

# # How do they handle any number of inputs?
# # How can WE build functions like that?
# # That's what we learn today.

def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item("apple"))    # ['apple']
print(add_item("banana"))   # ['apple', 'banana']  — Wait, what?
print(type(add_item))              # <class 'function'>
print(add_item.__defaults__)       # (['apple', 'banana'],)