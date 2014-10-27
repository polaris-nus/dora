from mds.dora.utils import *
from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login

def index(request):	
	user = authenticate(username='admin', password='Sanamobile1')
	if user is not None:
		if user.is_active:
			login(request, user)
			# Redirect to a success page.
			return render(request, 'main.html', {})
		else:
			# Return a 'disabled account' error message
			return HttpResponse('{"assigned":[], "unassigned":[], "status":"disabled account"}', content_type="application/json")
	else:
		# Return an 'invalid login' error message.
		return HttpResponse('{"assigned":[], "unassigned":[], "status":"invalid login"}', content_type="application/json")


@csrf_exempt
def query(request):
	if (not request.user.is_authenticated()):
		return HttpResponse('{"assigned":[], "unassigned":[], "status":"unauthorized"}', content_type="application/json")		
	#Parse the request
	query, concepts_list, locations_list = parse_request(request)
	if (query == None and concepts_list == None and locations_list == None):
		return HttpResponse('{"assigned":[], "unassigned":[], "status":"error"}', content_type="application/json")		

	#Make the query
	query_result_set = get_query_result_set(query, concepts_list, locations_list)

	#Create a list of json objects
	json_obj_list = create_json_obj_list(query_result_set)

	#transform json objects into one json array of objects
	json_obj_array = generate_json_obj_to_return(json_obj_list)

	return HttpResponse(json_obj_array, content_type="application/json")
 