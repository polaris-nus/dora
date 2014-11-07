import random, cjson
from mds.dora.models import *
from datetime import *
from django.contrib.gis.geos import Point
from django.template import Context, loader


def setup_get_QRS_results():
	results = []
	results.append([])
	results.append([])
	results.append([])
	results.append([])

	results[0].append({"uuid" : "3f6a6d55-abd4-4198-8f4e-807263b16ac7"})
	results[0].append({"uuid" : "56bd2478-e6da-48b4-8e5a-15818f62d2d9"})
	results[0].append({"uuid" : "757dbc15-8ca1-4701-8a23-f80f8ab630f5"})
	results[0].append({"uuid" : "b0df866b-95c0-4db9-baea-9a819599d51d"})

	results[1].append({"uuid" : "3f6a6d55-abd4-4198-8f4e-807263b16ac7"})
	results[1].append({"uuid" : "56bd2478-e6da-48b4-8e5a-15818f62d2d9"})
	results[1].append({"uuid" : "b0df866b-95c0-4db9-baea-9a819599d51d"})

	results[2].append({"uuid" : "56bd2478-e6da-48b4-8e5a-15818f62d2d9"})
	results[2].append({"uuid" : "b0df866b-95c0-4db9-baea-9a819599d51d"})	

	results[3].append({"uuid" : "56bd2478-e6da-48b4-8e5a-15818f62d2d9"})	

	return results

def check_assertions(self, query_result_set, results, check_num):
	query_result_list = []
	for query_result in query_result_set:
		query_result_list.append({
			"uuid":query_result.uuid
		})

	self.assertEqual(len(query_result_list), len(results[check_num]))
	for i in range(0,len(results[check_num])):
		self.assertEqual(query_result_list[i]['uuid'], results[check_num][i]['uuid'])


def setup_create_json_obj_list_results():
	results = {}
	results['assigned'] = []
	results['unassigned'] = []
	results['status'] = "ok"
	json_template = loader.get_template('json_obj_template')
	results['assigned'].append(cjson.decode('{"uuid": "56bd2478-e6da-48b4-8e5a-15818f62d2d9","subject": {"family_name": "pavey","uuid": "c7c21c30-5865-4d00-a5cb-32b69108947d","given_name": "petersen","dob": "1943-02-09 05:35:46.259076","gender": "M"},"created_date": "2014-10-26 23:59:48.086540","modified_date": "2014-10-26 23:59:48.086540","procedure": "apply disinfectant and give antibiotics","observer": "test2","location": {"coords": "POINT (-1.5758419447100001 10.5434422844999993)","alt": "alt!"}}'))
	return results

# {
#     "uuid": "56bd2478-e6da-48b4-8e5a-15818f62d2d9",
#     "subject": {
#         "family_name": "pavey",
#         "uuid": "c7c21c30-5865-4d00-a5cb-32b69108947d",
#         "given_name": "petersen",
#         "dob": "1943-02-09 05:35:46.259076",
#         "gender": "M"
#     },
#     "created_date": "2014-10-26 23:59:48.086540",
#     "modified_date": "2014-10-26 23:59:48.086540",
#     "procedure": "apply disinfectant and give antibiotics",
#     "observer": "test2",
#     "location": {
#         "coords": "POINT (-1.5758419447100001 10.5434422844999993)",
#         "alt": "alt!"
#     }
#	
# }