var TestingQRS = {
	QRSStubs: [
		{
			"assigned": [
				{
					"uuid": "46ea15e0-84f7-4fc0-be67-968b0d0f8b0c",
					"subject": {
						"family_name": "pavey",
						"uuid": "6f5adca7-f93d-4df4-a0f8-7b0bdf641477",
						"given_name": "gino",
						"dob": "1986-12-03 09:57:46.098307",
						"gender": "F"
					},
					"created_date": "2012-10-26 11:41:01.857842",
					"modified_date": "2012-10-26 11:41:01.857842",
					"procedure": "prescribe panadol",
					"observer": "test2",
					"location": {
						"coords": "POINT (4.4841310064500002 27.9573943020999990)",
						"alt": "alt!"
					}
				},
				{
					"uuid": "416f08fa-3b5a-48fd-aa6e-0a7c8bcf6660",
					"subject": {
						"family_name": "garrott",
						"uuid": "e4be4663-09e7-4d01-98c9-277c71c16f16",
						"given_name": "parnell",
						"dob": "1947-11-06 19:42:47.081103",
						"gender": "M"
					},
					"created_date": "2012-10-28 09:58:42.749669",
					"modified_date": "2012-10-28 09:58:42.749669",
					"procedure": "prescribe panadol",
					"observer": "test2",
					"location": {
						"coords": "POINT (3.8049175320400002 17.2785535910000010)",
						"alt": "alt!"
					}
				},
			],
			"unassigned": [
				{
					"uuid": "5ccc4992-13dc-432d-8f29-713c20b20195",
					"subject": {
						"family_name": "ramsay",
						"uuid": "b2e44c7a-99d9-4d62-b3bd-a4bd813d4d03",
						"given_name": "mischa",
						"dob": "1977-12-20 14:49:46.204322",
						"gender": "M"
					},
					"created_date": "2012-10-26 14:58:57.506617",
					"modified_date": "2012-10-26 14:58:57.506617",
					"procedure": "prescribe panadol",
					"observer": "test2",
					"location": {
						"coords": "None",
						"alt": "alt!"
					}
				},
				{
					"uuid": "53bddf37-a066-4e2e-b951-f40eef8f5e4e",
					"subject": {
						"family_name": "mansere",
						"uuid": "e19c22d2-9140-4069-ba05-723f1f6df040",
						"given_name": "pickthore",
						"dob": "2008-07-13 19:06:46.207202",
						"gender": "M"
					},
					"created_date": "2012-10-28 00:51:48.552327",
					"modified_date": "2012-10-28 00:51:48.552327",
					"procedure": "prescribe panadol",
					"observer": "test2",
					"location": {
						"coords": "None",
						"alt": "alt!"
					}
				}
			],
			"status": "ok",
			"filters": {
				"diagnosis": "fever"
			},
			"color": {
				"featureColor": "#B71B1B",
				"buttonStyleIndex": 0
			},
			"isVisible": true
		},
		{
			"assigned": [
				{
					"uuid": "ebf6e286-a968-4246-8e98-5b902556a293",
					"subject": {
						"family_name": "calverley",
						"uuid": "65c2214f-2303-4dd1-bffb-b38bdd9b1f8d",
						"given_name": "dove",
						"dob": "1971-10-04 15:12:46.325344",
						"gender": "F"
					},
					"created_date": "2013-06-25 03:59:50.233635",
					"modified_date": "2013-06-25 03:59:50.233635",
					"procedure": "administer lozenges",
					"observer": "test2",
					"location": {
						"coords": "POINT (2.5588654804200002 11.8210028481999990)",
						"alt": "alt!"
					}
				}
			],
			"unassigned": [
				{
					"uuid": "b2d61b33-56e2-4841-be45-3204781f97bc",
					"subject": {
						"family_name": "benedicto",
						"uuid": "81965c8f-e488-4bf9-83c6-eda75842e178",
						"given_name": "chevy",
						"dob": "2010-01-26 17:42:47.645926",
						"gender": "F"
					},
					"created_date": "2014-10-20 11:07:21.725941",
					"modified_date": "2014-10-20 11:07:21.725941",
					"procedure": "administer lozenges",
					"observer": "test2",
					"location": {
						"coords": "None",
						"alt": "alt!"
					}
				},
				{
					"uuid": "3ce6db55-aeae-4a8c-a047-b335a2bdabe9",
					"subject": {
						"family_name": "neuman",
						"uuid": "f7bbf9c7-0a22-4425-b291-16e61f284b0e",
						"given_name": "fazakerley",
						"dob": "1975-05-05 11:09:47.430287",
						"gender": "F"
					},
					"created_date": "2014-10-24 13:27:50.327572",
					"modified_date": "2014-10-24 13:27:50.327572",
					"procedure": "administer lozenges",
					"observer": "test2",
					"location": {
						"coords": "None",
						"alt": "alt!"
					}
				}
			],
			"status": "ok",
			"filters": {
				"diagnosis": "sore throat",
			},
			"location": [
				"POLYGON((-9.492187500000112 27.44979032978419,-9.84375000000045 7.100892668623654,8.261718750000012 6.926426847059551,6.8554687500000115 34.95799531086818,-9.492187500000112 27.44979032978419))"
			],
			"color": {
				"featureColor": "#FF7B11",
				"buttonStyleIndex": 1
			},
			"isVisible": true
		}
	],
	getStub: function(index) {
		if ( 0 <= index && index < this.QRSStubs.length) {
			return JSON.parse(JSON.stringify(this.QRSStubs[index]));
		}
	}

}

