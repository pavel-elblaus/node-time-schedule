'use strict';

// функци€ перевода секунд в hh:mm:ss
const hms = function (seconds)
{
	return [
		Math.floor(seconds / 3600000) % 24,
		Math.floor(seconds / 60000) % 60,
		Math.floor(seconds / 1000) % 60
	].map(v => v < 10 ? "0" + v : v).join(":");
}
// функци€ перевода строчной недели к цифре
const s2m = function (s)
{
	let m = { "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6, "Sun": 0 };
	return typeof m[s] !== "undefined" ? m[s] : false;
}
// функци€ получени€ промежутков рабочих и не рабочих часов
const get_schedule = function (timeline)
{
	// ≈—Ћ» ѕ–≈ƒјЌЌќ TRUE, Ё“ќ ¬≈—№ ƒ≈Ќ№
	if (timeline === true){
		timeline = "0";
	}

	// ѕј–—»ћ ѕќЋ”„≈ЌЌ”ё —“–ќ„ ” –ј—ѕ»—јЌ»я
	let schedule = [];
	let interval = timeline.split(",");
	for (let i1 in interval) {
		// парсим врем€
		let range = interval[i1].split("-");
		for (let i2 in range){
			let time = range[i2].split(":");
			switch (time.length) {
				// часы, минуты, секунды
				default:
				case 3:
					range[i2] = +time[0] * 3600 + +time[1] * 60 + +time[2];
					break;
				// часы, минуты
				case 2:
					range[i2] = +time[0] * 3600 + +time[1] * 60;
					break;
				// часы
				case 1:
					range[i2] = +time[0] * 3600;
					break;
			}
			range[i2] *= 1000;
		}

		// проверка значени€ не привышающее сутки и существовани€
		if(range[0] > 86400000) range[0] = 86400000;
		if(range[1] > 86400000 || typeof range[1] === "undefined") range[1] = 86400000;

		// если старт больше чем конец
		if(range[0] > range[1]){
			if(range[1] !== 0){
				schedule.push([
					0,
					range[1]
				])
			}
			range[1] = 86400000;
		}

		// если в интервале не одинаковые значени€ добавл€ем в расписание
		if(range[0] !== range[1]){
			schedule.push(range)
		}
	}

	// ¬џ„»—Ћя≈ћ –јЅќ„»≈ ѕ–ќћ≈∆”“ »
	let work_range = [];
	// если в расписании больше одного периода
	if(schedule.length > 1){
		// сортировка - в правильную линию времени
		schedule.sort(function(a,b) {
			return a[0] - b[0] || a[1] - b[1];
		});
		// поиск и объединение смежный интервалов
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

	// ¬џ„»—Ћя≈ћ Ќ≈ –јЅќ„»≈ ѕ–ќћ≈∆”“ »
	let not_work_range = [];
	for (let i1 in work_range) (function (r1){
		let length = not_work_range.length
		// первый интервал
		if(length === 0){
			// начало, если не 0
			if(r1[0] !== 0){
				not_work_range.push([
					0, r1[0]
				]);
			}
		} else {
			// послед интервалы, замен€ем у предыдущего
			not_work_range[length - 1][1] = r1[0];
		}
		// конец, добавл€ем если это не последн€€ секунда дн€
		if(r1[1] !== 86400000){
			not_work_range.push([
				r1[1], 86400000
			]);
		}
	})(work_range[i1]);

	// ¬ќ«¬–ј“ ѕќЋ”„≈ЌЌџ’ ƒјЌЌџ’
	return {
		work_range, work_range_string: work_range.map(v => hms(v[0]) + "-" + hms(v[1])).join(", "),
		not_work_range, not_work_range_string: not_work_range.map(v => hms(v[0]) + "-" + hms(v[1])).join(", ")
	}
}

/**
 * Ѕиблиотека построени€ расписани€ интервалов рабочего/нерабочего времени
 *
 * @info правила (примеры) интервалов в расписание:
 *                        # отсутствующие в объекте расписание дл€ дн€ недели считаетс€ не рабочем днем
 *    ""                  # не работает
 *    null                # не работает
 *    false               # не работает
 *    "0"                 # работает весь день
 *    true                # работает весь день
 *    "1-8"               # работает c 01:00:00 до 08:00:00
 *    "7:30-15:00"        # работает c 07:30:00 до 15:00:00
 *    "12:30:15"          # работает c 12:30:15 до 00:00:00
 *    "18-10"             # работает c 00:00:00 до 10:00:00, c 18:00:00 до 00:00:00
 *    "1-8, 23"           # работает c 01:00:00 до 08:00:00, c 23:00:00 до 00:00:00
 *    "0:30-3, 23, 7-9"   # работает c 00:30:00 до 03:00:00, c 07:00:00 до 09:00:00, c 23:00:00 до 00:00:00
 *
 * @param schedule_work: object {    # работает по расписанию индивидуальному дл€ каждого дн€ недели
 *    "Mon": "",
 *    "Tue": "",
 *    "Wed": "",
 *    "Thu": "",
 *    "Fri": "",
 *    "Sat": "",
 *    "Sun": ""
 * } |                   string ""   # работает всю неделю по единому расписанию
 *
 * @returns object {
 *    check: function ({ until_time: string, timeout: number } | false),
 *    timetable: array []
 * }
 */
module.exports = function (schedule_work)
{
	// собираем таблицу расписани€ по дн€м недели
	let timetable = [false, false, false, false, false, false, false];
	// если передан рабочий график
	if(schedule_work !== "" && schedule_work !== null && schedule_work !== false){
		// график на все дни недели
		if(typeof schedule_work === "string" || schedule_work === true){
			(function (timeline){
				for (let week in timetable){
					timetable[week] = timeline;
				}
			})(get_schedule(schedule_work))
		}
		// график по дн€м недели
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

	// »—ѕќЋЌя≈ћјя ‘”Ќ ÷»я ќѕ–≈ƒ≈Ћ≈Ќ»я »Ќ“≈–¬јЋј –јЅќ“
	return {
		// расписание
		timetable,
		// проверка вхождени€ в не рабочий интервал, в ответ (ms) до след рабочего интервала
		check: function (){
			// сейчас
			let dc = new Date();
			// запрос расписани€ на текущей день недели
			let schedule = this.timetable[dc.getDay()];
			// сегодн€ не работает, возвращаем остаток времени до конца дн€
			if(schedule === false){
				// конец дн€
				let de = new Date(dc); de.setHours(24,0,0,0);
				// возврат, сколько секунд осталось до конца дн€
				return {
					timeout: de.getTime() - dc.getTime(),
					until_time: "00:00:00"
				};
			}
			// поиск вхождени€ в интервал
			else {
				// на начало дн€
				let ds = new Date(dc); ds.setHours(0,0,0,0);
				// сколько секунд прошло с начала дн€
				let cur = dc.getTime() - ds.getTime();
				// поиск вхождени€ в нерабочий интервал
				for (let i1 in schedule.not_work_range){
					let r = schedule.not_work_range[i1];
					if (cur > r[0] && cur < r[1]){
						// возврат, сколько секунд осталось до следующего интервала по расписанию
						return {
							timeout: r[1] - cur,
							until_time: hms(r[1])
						};
					}
				}
			}
			// не попали в нерабочий интервал, продолжаем работу...
			return false;
		}
	}
}