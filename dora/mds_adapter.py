import sys, urllib2, json
#from dora.dora.models import Patient, Disease


def get_diagnosis_and_gps_lists(list):
	
	observation_list = (json.loads(list))['message']
	diagnosis_list = []
	gps_list = []

	for observation in observation_list:
		if observation['concept']['name'] == "LOCATION GPS":
			gps_list.append(observation)
		elif observation['concept']['name'] == "DIAGNOSIS":
			diagnosis_list.append(observation)

	return diagnosis_list, gps_list


def populate_database(subjects, diseases):
	pass


def main(argv):

	url = "http://mdstest.codeofjoy.com/core/observation/"
	response = urllib2.urlopen(url)

	if response.getcode() == 200:
		diagnosis_list = []
		gps_list = []

		diagnosis_list,gps_list = get_diagnosis_and_gps_lists(response.read())

		#This is for debugging/checking purposes
		for diagnosis in diagnosis_list:
			print diagnosis['concept']['name'] + " " + diagnosis['encounter']['created']
		for gps in gps_list:
			print gps['concept']['name'] + " " + gps['encounter']['created']
		#end of debugging/checking block

		populate_database(diagnosis_list,gps_list)
	return 0

if __name__ == "__main__":
	main(sys.argv)