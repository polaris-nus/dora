from dora.utils import *
from django.shortcuts import render

def index(request):	
    return render(request, 'main.html', {})


def query(request):
	#Make the query
	query_result_set = get_query_result_set(request)

	#Create a list of json objects
	json_obj_list = []
	if (query_result_set):
		json_obj_list = create_json_obj_list(query_result_set)

	#transform json objects into one json array of objects
	json_query_results = generate_json_obj_to_return(json_obj_list)

	return json_query_results
