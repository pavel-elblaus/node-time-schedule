'use strict';

// ������� �������� ������ � hh:mm:ss
const hms = function (seconds)
{
	return [
		Math.floor(seconds / 3600000) % 24,
		Math.floor(seconds / 60000) % 60,
		Math.floor(seconds / 1000) % 60
	].map(v => v < 10 ? "0" + v : v).join(":");
}
// ������� �������� �������� ������ � �����
const s2m = function (s)
{
	let m = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0 };
	return typeof m[s] !== "undefined" ? m[s] : false;
}
// ������� ��������� ����������� ������� � �� ������� �����
const get_schedule = function (timeline)
{
	// ���� �������� TRUE, ��� ���� ����
	if (timeline === true){
		timeline = "0";
	}

	// ������ ���������� ������� ����������
	let schedule = [];
	let interval = timeline.split(",");
	for (let i1 in interval) {
		// ������ �����
		let range = interval[i1].split("-");
		for (let i2 in range){
			let time = range[i2].split(":");
			switch (time.length) {
				// ����, ������, �������
				default:
				case 3:
					range[i2] = +time[0] * 3600 + +time[1] * 60 + +time[2];
					break;
				// ����, ������
				case 2:
					range[i2] = +time[0] * 3600 + +time[1] * 60;
					break;
				// ����
				case 1:
					range[i2] = +time[0] * 3600;
					break;
			}
			range[i2] *= 1000;
		}

		// �������� �������� �� ����������� ����� � �������������
		if(range[0] > 86400000) range[0] = 86400000;
		if(range[1] > 86400000 || typeof range[1] === "undefined") range[1] = 86400000;

		// ���� ����� ������ ��� �����
		if(range[0] > range[1]){
			if(range[1] !== 0){
				schedule.push([
					0,
					range[1]
				])
			}
			range[1] = 86400000;
		}

		// ���� � ��������� �� ���������� �������� ��������� � ����������
		if(range[0] !== range[1]){
			schedule.push(range)
		}
	}

	// ��������� ������� ����������
	let work_range = [];
	// ���� � ���������� ������ ������ �������
	if(schedule.length > 1){
		// ���������� - � ���������� ����� �������
		schedule.sort(function(a,b) {
			return a[0] - b[0] || a[1] - b[1];
		});
		// ����� � ����������� ������� ����������
		for (let i1 in schedule) (function (r2){
			for (let i2 in work_range) {
				let r1 = work_range[i2];
				if (r2[0] >= r1[0] && r2[0] <= r1[1] || r2[1] >= r1[0] && r2[1] <= r1[1]){
					work_range[i2] = [
						Math.min(r2[0], r1[0]),
						Math.max(r2[1], r1[1])
					];
					return;
				}
			}
			work_range.push(r2);
		})(schedule[i1]);
	} else {
		work_range = schedule;
	}

	// ��������� �� ������� ����������
	let not_work_range = [];
	for (let i1 in work_range) (function (r1){
		let length = not_work_range.length
		// ������ ��������
		if(length === 0){
			// ������, ���� �� 0
			if(r1[0] !== 0){
				not_work_range.push([
					0, r1[0]
				]);
			}
		} else {
			// ������ ���������, �������� � �����������
			not_work_range[length - 1][1] = r1[0];
		}
		// �����, ��������� ���� ��� �� ��������� ������� ���
		if(r1[1] !== 86400000){
			not_work_range.push([
				r1[1], 86400000
			]);
		}
	})(work_range[i1]);

	// ������� ���������� ������
	return {
		work_range, work_range_string: work_range.map(v => hms(v[0]) + "-" + hms(v[1])).join(", "),
		not_work_range, not_work_range_string: not_work_range.map(v => hms(v[0]) + "-" + hms(v[1])).join(", ")
	}
}

/**
 * ���������� ���������� ���������� ���������� ��������/���������� �������
 *
 * @info ������� (�������) ���������� � ����������:
 *                        # ������������� � ������� ���������� ��� ��� ������ ��������� �� ������� ����
 *    ""                  # �� ��������
 *    null                # �� ��������
 *    false               # �� ��������
 *    "0"                 # �������� ���� ����
 *    true                # �������� ���� ����
 *    "1-8"               # �������� c 01:00:00 �� 08:00:00
 *    "7:30-15:00"        # �������� c 07:30:00 �� 15:00:00
 *    "12:30:15"          # �������� c 12:30:15 �� 00:00:00
 *    "18-10"             # �������� c 00:00:00 �� 10:00:00, c 18:00:00 �� 00:00:00
 *    "1-8, 23"           # �������� c 01:00:00 �� 08:00:00, c 23:00:00 �� 00:00:00
 *    "0:30-3, 23, 7-9"   # �������� c 00:30:00 �� 03:00:00, c 07:00:00 �� 09:00:00, c 23:00:00 �� 00:00:00
 *
 * @param schedule_work: object {    # �������� �� ���������� ��������������� ��� ������� ��� ������
 *    "Mon": "",
 *    "Tue": "",
 *    "Wed": "",
 *    "Thu": "",
 *    "Fri": "",
 *    "Sat": "",
 *    "Sun": ""
 * } |                   string ""   # �������� ��� ������ �� ������� ����������
 *
 * @returns object {
 *    check: function ({ until_time: string, timeout: number } | false),
 *    timetable: array []
 * }
 */
module.exports = function (schedule_work)
{
	// �������� ������� ���������� �� ���� ������
	let timetable = [false, false, false, false, false, false, false];
	// ���� ������� ������� ������
	if(schedule_work !== "" && schedule_work !== null && schedule_work !== false){
		// ������ �� ��� ��� ������
		if(typeof schedule_work === "string" || schedule_work === true){
			(function (timeline){
				for (let week in timetable){
					timetable[week] = timeline;
				}
			})(get_schedule(schedule_work))
		}
		// ������ �� ���� ������
		else {
			for (let week_string in schedule_work){
				let schedule_week = schedule_work[week_string];
				if(schedule_week !== "" && schedule_week !== null && schedule_week !== false){
					let week = s2m(week_string);
					if(week !== false){
						timetable[week] = get_schedule(schedule_week);
					}
				}
			}
		}
	}

	// ����������� ������� ����������� ��������� �����
	return {
		// ����������
		timetable,
		// �������� ��������� � �� ������� ��������, � ����� (ms) �� ���� �������� ���������
		check: function (){
			// ������
			let dc = new Date();
			// ������ ���������� �� ������� ���� ������
			let schedule = this.timetable[dc.getDay()];
			// ������� �� ��������, ���������� ������� ������� �� ����� ���
			if(schedule === false){
				// ����� ���
				let de = new Date(dc); de.setHours(24,0,0,0);
				// �������, ������� ������ �������� �� ����� ���
				return {
					timeout: de.getTime() - dc.getTime(),
					until_time: "00:00:00"
				};
			}
			// ����� ��������� � ��������
			else {
				// �� ������ ���
				let ds = new Date(dc); ds.setHours(0,0,0,0);
				// ������� ������ ������ � ������ ���
				let cur = dc.getTime() - ds.getTime();
				// ����� ��������� � ��������� ��������
				for (let i1 in schedule.not_work_range){
					let r = schedule.not_work_range[i1];
					if (cur > r[0] && cur < r[1]){
						// �������, ������� ������ �������� �� ���������� ��������� �� ����������
						return {
							timeout: r[1] - cur,
							until_time: hms(r[1])
						};
					}
				}
			}
			// �� ������ � ��������� ��������, ���������� ������...
			return false;
		}
	}
}