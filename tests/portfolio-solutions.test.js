const cp=require('child_process');
const assert=require('assert');

const python=`
import importlib.util, math, random

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    mod=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

fizz=load('fizz','student-code/practice/python/fizzbuzz/fizzbuzz.py')
assert fizz.fizzbuzz(1)==[1]
assert fizz.fizzbuzz(15)[-1]=='FizzBuzz'
assert fizz.fizzbuzz(5)==[1,2,'Fizz',4,'Buzz']

second=load('second','student-code/practice/python/real-second-largest-distinct/real-second-largest-distinct.py')
assert second.solution([]) is None
assert second.solution([7]) is None
assert second.solution([7,7,7]) is None
assert second.solution([10,5,8,5,8])==8
assert second.solution([-10,-3,-7])==-7

valley=load('valley','student-code/practice/python/real-valley-array/real-valley-array.py')
assert valley.solution([5,3,1,2,4]) is True
assert valley.solution([3,2,1]) is False
assert valley.solution([1,2,3]) is False
assert valley.solution([5,3,3,4]) is False
assert valley.solution([2,1,2]) is True
assert valley.solution([2,1]) is False

two=load('two','student-code/practice/dsa/two-sum/dsa-two-sum.py')
assert two.two_sum([2,7,11,15],9)==[0,1]
assert two.two_sum([3,3],6)==[0,1]
assert two.two_sum([1,2,3],100) is None

bank=load('bank','student-code/practice/oop/oop-counter-state/oop-counter-state.py')
assert bank.run_ops([('deposit',100),('withdraw',40)])==60
acct=bank.BankAccount(10)
try:
    acct.deposit(-1)
    raise AssertionError('negative deposit was accepted')
except ValueError:
    pass
try:
    bank.run_ops([('unknown',1)])
    raise AssertionError('unknown operation was accepted')
except ValueError:
    pass

point=load('point','student-code/practice/oop/oop-point/oop-point.py')
assert point.make_dist(3,4)==5
assert math.isclose(point.make_dist(-5,12),13)

# Randomized reference checks catch regressions in the three algorithmic items.
for _ in range(1500):
    values=[random.randint(-30,30) for _ in range(random.randint(0,30))]
    distinct=sorted(set(values),reverse=True)
    expected=distinct[1] if len(distinct)>=2 else None
    assert second.solution(values)==expected

for _ in range(1500):
    values=[random.randint(-15,15) for _ in range(random.randint(0,20))]
    expected=False
    if len(values)>=3:
        for bottom in range(1,len(values)-1):
            if all(values[i]>values[i+1] for i in range(bottom)) and all(values[i]<values[i+1] for i in range(bottom,len(values)-1)):
                expected=True
                break
    assert valley.solution(values)==expected

for _ in range(1500):
    values=[random.randint(-20,20) for _ in range(random.randint(0,30))]
    target=random.randint(-30,30)
    result=two.two_sum(values,target)
    if result is None:
        assert not any(values[i]+values[j]==target for i in range(len(values)) for j in range(i+1,len(values)))
    else:
        i,j=result
        assert 0<=i<j<len(values)
        assert values[i]+values[j]==target

print('Portfolio solution behavior passed: deterministic edge cases + 4,500 randomized checks.')
`;

function findPython(){
  for(const cmd of ['python3','python']){
    const probe=cp.spawnSync(cmd,['--version'],{encoding:'utf8'});
    if(probe.status===0)return cmd;
  }
  return null;
}

const command=findPython();
assert(command,'Python 3 is required for portfolio solution behavior tests');
const result=cp.spawnSync(command,['-c',python],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
if(result.stdout)process.stdout.write(result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
assert.equal(result.status,0,'Portfolio solution behavior tests failed');
