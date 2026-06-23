# def calculate_bmi(weight_kg, height_m):
#     """Calculate Body Mass Index from weight and height.

#     Parameters:
#         weight_kg: Weight in kilograms
#         height_m: Height in meters

#     Returns:
#         BMI as a float
#     """
#     return weight_kg / (height_m ** 2)

# print(help(calculate_bmi))

# print = "I am not a function anymore"
# print("Hello")

# --- Setup ---
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b


# --- Test 1: Assign to a variable ---
operation = add
print(operation(10, 3))        # 13


# --- Test 2: Pass as an argument to another function ---
def apply(func, x, y):
    return func(x, y)

print(apply(add, 10, 3))       # 13
print(apply(subtract, 10, 3))  # 7


# --- Test 3: Return from a function ---
def choose_operation(choice):
    if choice == "add":
        return add
    return subtract

op = choose_operation("add")
print(op(10, 3))               # 13


# --- Test 4: Store in a data structure ---
operations = {
    "add": add,
    "subtract": subtract,
}

print(operations["add"](10, 3))       # 13
print(operations["subtract"](10, 3))  # 7