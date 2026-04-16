# ✅ SALARY CALCULATION - EXACT NEW RULES

## 📋 COMPLETE REQUIREMENTS

### 1️⃣ Monthly 1.5 Days Paid Leave
- **Har month**: 1.5 days paid leave milti hai
- **Cumulative**: Agar use nahi ki to carry forward hoti hai
- **Example**:
  - January: 1.5 days available
  - Agar 0 days use → 1.5 days carry forward to February
  - February: 1.5 (new) + 1.5 (carry) = 3.0 days available

### 2️⃣ Sunday Comp Off Logic
- **Sunday ko kaam kiya** → Comp off milega (hours track hote hain)
- **Comp off ka use**: SIRF unpaid leaves pe
- **No extra payment**: Comp off ka payment nahi milega, sirf leave adjustment

### 3️⃣ Company Leave (2nd & 4th Saturday)
- **2nd aur 4th Saturday**: Company leave (PAID)
- **Salary cut nahi hogi**: Ye paid holidays hain
- **Database**: `CompanyLeave` table me store

### 4️⃣ Paid Leave Carry Forward Logic

#### Example Flow:
```
JANUARY:
- Available: 1.5 days
- Used: 0.5 days (half day)
- Remaining: 1.0 day
- Carry Forward to Feb: 1.0 day ✅

FEBRUARY:
- Carry Forward: 1.0 day
- New Monthly: 1.5 days
- Total Available: 2.5 days
- Used: 0 days
- Carry Forward to March: 2.5 days ✅

MARCH:
- Carry Forward: 2.5 days
- New Monthly: 1.5 days
- Total Available: 4.0 days
- Used: 3.0 days
- Remaining: 1.0 day
- Carry Forward to April: 1.0 day ✅
- Salary Cut: 0 days (all covered)
```

#### Salary Cut Example:
```
MARCH (with excess leaves):
- Carry Forward: 2.5 days
- New Monthly: 1.5 days
- Total Available: 4.0 days
- Leave Taken: 4.5 days
- Calculation:
  * 4.0 days paid leave used
  * 0.5 days UNPAID → Salary Cut: 0.5 days ❌
- Carry Forward to April: 0 days
```

### 5️⃣ Comp Off Carry Forward Logic

#### Example Flow:
```
JANUARY:
- Leave Taken: 2 days
- Paid Leave Available: 1.5 days
- Unpaid: 0.5 days
- Comp Off Available: 1 day (9 hours)
- Comp Off Used: 0.5 days for unpaid leave
- Comp Off Remaining: 0.5 days
- Comp Off Carry Forward to Feb: 0.5 days ✅

FEBRUARY:
- Comp Off Carry Forward: 0.5 days
- Paid Leave: 1.5 days
- Total Available: 1.5 paid + 0.5 comp off
- Leave Taken: 2 days
- Calculation:
  * 1.5 days paid leave used
  * 0.5 days comp off used
  * Salary Cut: 0 days ✅
```

---

## 🔧 BACKEND IMPLEMENTATION

### File: `salary_calculator.py`

```python
def calculate_monthly_salary_exact_rules(employee_id, month, year, attendance_data, manual_comp_off=None, manual_carry_forward=None):
    """
    EXACT NEW RULES:
    1. Monthly 1.5 days paid leave (cumulative)
    2. Comp off only for unpaid leaves
    3. Company leaves are paid
    4. Carry forward logic for both paid leave and comp off
    """
    
    # Step 1: Get previous month carry forward
    previous_carry_forward = get_previous_carry_forward(employee, month, year)
    
    # Step 2: Calculate available resources
    monthly_paid_leave = 1.5
    total_available_paid = previous_carry_forward + monthly_paid_leave
    
    # Step 3: Calculate leave needed
    half_day_equivalent = half_days * 0.5
    total_leave_needed = leave_days + half_day_equivalent
    
    # Step 4: Apply paid leave first
    if total_leave_needed <= total_available_paid:
        paid_leave_used = total_leave_needed
        new_carry_forward = total_available_paid - total_leave_needed
        comp_off_used = 0
        salary_cut_days = 0
    else:
        # Step 5: Use comp off for remaining
        paid_leave_used = total_available_paid
        remaining_needed = total_leave_needed - total_available_paid
        
        comp_off_used = min(manual_comp_off or 0, available_comp_off, remaining_needed)
        remaining_needed -= comp_off_used
        
        # Step 6: Salary cut for remaining
        salary_cut_days = max(0, remaining_needed)
        new_carry_forward = 0
    
    return {
        'paid_leave_used': paid_leave_used,
        'comp_off_used': comp_off_used,
        'salary_cut_days': salary_cut_days,
        'new_carry_forward': new_carry_forward
    }
```

### Database Fields (MonthlySalary Model)

```python
class MonthlySalary(models.Model):
    # ✅ NEW EXACT RULE FIELDS
    paid_leave_used = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    unpaid_leave_used = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    comp_off_used = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    salary_cut_days = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    
    # Carry forward fields
    carry_forward_half_days = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)  # Previous month
    used_carry_forward = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    new_carry_forward = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)  # To next month
```

---

## 🎨 FRONTEND IMPLEMENTATION

### File: `SalaryCreate.jsx`

#### Comp Off Dialog Logic:

```javascript
const showCompOffUsageDialog = async () => {
    const stats = calculateWorkingStats();
    
    // Calculate requirements
    const monthlyPaidLeave = 1.5;
    const unpaidLeaves = Math.max(0, stats.leaveDaysCount - monthlyPaidLeave);
    const halfDaysRequiringCoverage = stats.halfDaysCount * 0.5;
    
    // Get previous carry forward
    const previousCarryForward = getPreviousCarryForward();
    
    // Calculate available resources
    const availableCompOffDays = Math.floor(compOffBalance / 9);
    const totalAvailablePaid = previousCarryForward + monthlyPaidLeave;
    
    // Show dialog if adjustments needed
    if (unpaidLeaves > 0 || halfDaysRequiringCoverage > 0) {
        setShowCompOffDialog(true);
    } else {
        // Direct calculation - no adjustments needed
        await processSalaryCalculation(stats, 0, "exact_new_rules");
    }
};
```

#### Display Carry Forward:

```javascript
const CarryForwardMessage = () => {
    const carryForwardData = currentSalaryData?.carry_forward_info;
    
    if (carryForwardData?.new_carry_forward > 0) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold">
                    🔄 Carry Forward to Next Month
                </p>
                <p className="text-blue-700">
                    {carryForwardData.new_carry_forward >= 1 
                        ? `${Math.floor(carryForwardData.new_carry_forward)} day(s)` 
                        : `${carryForwardData.new_carry_forward} half day(s)`}
                </p>
            </div>
        );
    }
    
    return null;
};
```

---

## 📊 ALL POSSIBLE SCENARIOS

### Scenario 1: No Leave Taken
```
Available: 1.5 days
Leave Taken: 0 days
Result:
- Salary Cut: 0 days
- Carry Forward: 1.5 days ✅
```

### Scenario 2: Half Day Leave
```
Available: 1.5 days
Leave Taken: 0.5 days
Result:
- Paid Leave Used: 0.5 days
- Salary Cut: 0 days
- Carry Forward: 1.0 day ✅
```

### Scenario 3: Exact Match
```
Available: 1.5 days
Leave Taken: 1.5 days
Result:
- Paid Leave Used: 1.5 days
- Salary Cut: 0 days
- Carry Forward: 0 days
```

### Scenario 4: Exceeds Paid (No Comp Off)
```
Available: 1.5 days
Leave Taken: 2.0 days
Comp Off: 0 days
Result:
- Paid Leave Used: 1.5 days
- Unpaid: 0.5 days → Salary Cut: 0.5 days ❌
- Carry Forward: 0 days
```

### Scenario 5: Exceeds Paid (With Comp Off)
```
Available: 1.5 days
Leave Taken: 2.0 days
Comp Off: 1 day available
Result:
- Paid Leave Used: 1.5 days
- Comp Off Used: 0.5 days
- Salary Cut: 0 days ✅
- Carry Forward: 0 days
- Comp Off Remaining: 0.5 days → Carries forward
```

### Scenario 6: Carry Forward Usage
```
Previous Carry Forward: 1.0 day
Monthly Paid: 1.5 days
Total Available: 2.5 days
Leave Taken: 3.0 days
Comp Off: 0 days
Result:
- Paid Leave Used: 2.5 days (carry + monthly)
- Unpaid: 0.5 days → Salary Cut: 0.5 days ❌
- Carry Forward: 0 days
```

### Scenario 7: Comp Off Carry Forward
```
Previous Comp Off: 0.5 days
Monthly Paid: 1.5 days
Leave Taken: 2.0 days
Result:
- Paid Leave Used: 1.5 days
- Comp Off Used: 0.5 days
- Salary Cut: 0 days ✅
- Carry Forward: 0 days
```

### Scenario 8: Sunday Comp Off Earned
```
Sunday Work: 1 day (9 hours)
Result:
- Comp Off Balance: +9 hours (+1 day)
- Can be used in future for unpaid leaves
- No extra payment
```

### Scenario 9: Company Leave (2nd/4th Saturday)
```
2nd Saturday: Company Leave
4th Saturday: Company Leave
Result:
- No salary cut
- Counted as paid days
- No leave deduction
```

### Scenario 10: Complex Mixed Scenario
```
Previous Carry Forward: 1.0 day
Previous Comp Off: 0.5 days
Monthly Paid: 1.5 days
Total Available: 1.0 + 1.5 = 2.5 paid + 0.5 comp off
Leave Taken: 3.5 days

Calculation:
- 2.5 days paid leave used
- 0.5 days comp off used
- Remaining: 0.5 days unpaid → Salary Cut: 0.5 days ❌
- Carry Forward: 0 days
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Backend:
- [x] Update `salary_calculator.py` with exact rules
- [ ] Update `views.py` calculate_monthly_salary function
- [ ] Test carry forward logic
- [ ] Test comp off usage
- [ ] Test salary cut calculation

### Frontend:
- [ ] Update comp off dialog to show carry forward
- [ ] Add manual selection for comp off and carry forward
- [ ] Display carry forward message after calculation
- [ ] Show previous month carry forward in UI
- [ ] Update salary history table with new fields

### Database:
- [ ] Run migrations for new fields
- [ ] Verify `new_carry_forward` field is populated correctly
- [ ] Test previous month carry forward retrieval

---

## 🚀 TESTING SCENARIOS

1. **Test Carry Forward**:
   - January: 0 leaves → 1.5 carry forward
   - February: Check 1.5 + 1.5 = 3.0 available

2. **Test Salary Cut**:
   - Take 2 days leave with only 1.5 available
   - Verify 0.5 days salary cut

3. **Test Comp Off**:
   - Work on Sunday → Earn comp off
   - Use comp off for unpaid leave
   - Verify comp off carry forward

4. **Test Company Leave**:
   - 2nd Saturday → No salary cut
   - 4th Saturday → No salary cut

---

## 📝 NOTES

- **IMPORTANT**: `new_carry_forward` field me SIRF paid leave carry forward store hoga
- Comp off ka carry forward alag se `CompOffBalance` table me track hoga
- Frontend me month 0-indexed hai (0-11), backend me 1-indexed (1-12)
- Salary calculation me calendar days use hote hain (30/31)
- Professional tax: ₹200 fixed

---

## 🎯 FINAL FORMULA

```
Total Available = Previous Carry Forward + 1.5 (Monthly Paid)
Leave Needed = Leave Days + (Half Days × 0.5)

IF Leave Needed <= Total Available:
    Paid Leave Used = Leave Needed
    Carry Forward = Total Available - Leave Needed
    Salary Cut = 0
ELSE:
    Paid Leave Used = Total Available
    Remaining = Leave Needed - Total Available
    
    IF Comp Off Available:
        Comp Off Used = min(Comp Off Available, Remaining)
        Remaining -= Comp Off Used
    
    Salary Cut = Remaining
    Carry Forward = 0
```

---

**Status**: ✅ Backend Updated | ⏳ Frontend Pending | ⏳ Testing Pending
