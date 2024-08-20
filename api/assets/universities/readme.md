[Instructions]
Search Types:

- next: Read from the same line
- next_line: Reads the content of the following line

Search Actions:

- #exact:value
- #contains:value
- #any_number:any_value

[Action]
Functions:

- function(code): execute the given code using new Function(code)() this can return a value
- join(...args): return an string with the result of prototype.join()
- split(text, delimiter, index: optional, ignore_errors: optional): return the string at index from text.split(delimiter) if no index, return the whole array
- replace(text, search, replacement, ignore_errors: optional): return the string with the search replacede with replacement
- parseDate(text): returns { start, end } given the date formated 'start-end'
- changeGroup(self: optional): changes the actual working group. If no arguments provided, it will set the group to group + 1
- nextSchedule(): changes the actual schedule to schedule + 1
- startRequirements(regex): Start to read the following lines and separate the group and name based on regex
- endRequirements(): Stop reading requirements
- disableVariables(): no variables will be change while this is active
- enableVariables(): disables the effect from disbleVariables function
- getRandomNumber(min, max): returns a random number from the min and max
- stop(): dont read more of the text

Variables:
Course:

- 'course_name'
- 'course_id'
- 'course_credits'

Group:

- 'group_id'
- 'course_teacher'
- 'group_quota'
- 'classroom'
- 'constant_date': optional, will set all the schedules.group_date of the group

Schedule:

- 'schedule_day'
- 'schedule_time'
- 'schedule_time_format'
- 'group_date'
- 'group_date_format'

Usage: '%{search_type:search_action}%=[action]'
