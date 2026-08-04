def solution(numbers):
    distinct_numbers=[]
    for number in numbers:
        if number not in distinct_numbers:
            distinct_numbers.append(number)
            
    if len(distinct_numbers)<2:
             return None
    distinct_numbers.sort(reverse=True)
    return distinct_numbers[1]
    
print(solution([10,5,8,5,8]))